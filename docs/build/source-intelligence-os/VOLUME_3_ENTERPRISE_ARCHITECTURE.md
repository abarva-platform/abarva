# AbarVa Source Intelligence Operating System Specification
## Volume 3 — Enterprise Architecture

> Classification: Board-Grade, Confidential · 2026-06-19 · Grounded against branch `codex/corpus-wave-24`.
> Review verdict: **board-ready**.

## Chapter 9 — Contract Intelligence

### Mandate: From Selection to Signed Contract

The sourcing lifecycle does not end when a vendor is selected. It ends — or fails — at signature. Between the Selection engine's award recommendation (Chapter 8) and the executed master agreement lies the most under-instrumented, highest-liability stretch of the entire journey: contracting. This is where negotiated leverage either crystallizes into enforceable terms or evaporates into vendor-favorable boilerplate; where a "tier-1, 99.95% availability" SLA promised in the BAFO round silently becomes "commercially reasonable best efforts" in the redline; where an uncapped indemnity or an auto-renewing evergreen clause is buried on page 47 of a 90-page Master Services Agreement that no procurement lead has the time — or the legal training — to fully parse. Elite advisory practices (Kearney's contracting playbooks, ISG's managed-services contract benchmarks) treat contract review as a distinct, evidence-anchored discipline with its own deliverables and sign-off chain. AbarVa Source must do the same.

**Why it matters.** The value captured across every prior stage — should-cost discipline (Volume 2, Chapter 5), evaluation rigor (Chapter 6), BAFO leverage (Chapter 7), risk-adjusted selection (Chapter 8) — is only *realized* if the signed contract preserves it. A 12% negotiated discount (illustrative range) that the contract fails to bind to a multi-year price-hold is a 12% discount the vendor reclaims at first renewal. **What problem it solves.** Today there is no layer that reconciles what was *negotiated and promised* against what is *written and enforceable*. The contract arrives as an uploaded PDF and is classified by filename keyword — nothing more. **How the gap manifests in the repo:** `src/lib/source/artifact-registry/upload-contract.ts` is misleadingly named. It contains no clause extraction, no redline logic, and no commercial-term parsing. It is purely a family/format classifier: `sourceArtifactFormatFromMime()` maps MIME types to formats and `inferSourceArtifactFamily()` infers a `SourceArtifactFamily` from the filename (e.g. `name.includes('commercial')` → `pricing_workbook`). An uploaded contract is registered, hashed (SHA-256), and stored — and then it is inert. Contract intelligence, as a reasoning capability, is **ABSENT**.

The anchor artifact for this layer is **d28 contract record** (`src/content/source-templates/selection/d28_contract_record.md`), stage Selection, owner role Legal. Today d28 is a five-section markdown stub (§1 reference, §2 term, §3 commercial-terms snapshot, §4 key clauses, §5 performance bonds) with placeholder prose and no generation logic — it is one of the 30 of 33 templates with no live generator (only d01/d05/d09 are live). This chapter specifies the engine that turns d28 from a manual fill-in form into the structured output of a verification reasoning pass, and that wires the SHIPPED-but-disconnected `ai-clause-gap` renderer to a real reasoning layer behind it.

### Redline & Clause-Gap Analysis

The first capability is **clause extraction and gap analysis**: parse the uploaded contract into a structured clause inventory, classify each clause by type, and compare each against an expected standard position.

**How it works — the parser upgrade.** The entry seam is `src/lib/source/artifact-registry/upload-contract.ts` and the shared text extractor `src/lib/source/artifact-registry/text-parser.ts`. But `text-parser.ts` is, by its own header, the "synchronous, first-mile parser for text-like Source uploads" — it handles pasted notes, Markdown, plain text, and CSV, and explicitly "does not replace the async binary/parser/vector/graph pipeline." It does **not** extract text from binary docx, xlsx, or pdf: it imports no `mammoth`, no `pdf-parse`, no `exceljs` (its parser id is `source_text_first_mile_v1`, handling pasted notes / Markdown / text / CSV via `extractLabeledLines` / `extractPricingComponents`). Those binary extractors exist in the repo only on the **Moves** side under `src/lib/programs/` (the Moves attachment pipeline — `programs/doc-parser.ts` and the `attachments/extract-text` path run `mammoth`/`pdf-parse`), not in Source; the `exceljs` dependency in `src/lib/source/exports/` is used only to *write* xlsx artifacts, never to read them. Rich binary vendor-document parsing is therefore a **net-new capability for Source** — it must build the binary-extraction stage (or reuse the Moves-side async pipeline), not extend `text-parser.ts`. Contracts arrive overwhelmingly as binary pdf/docx, so the `ContractClauseExtractor` cannot simply bolt a clause-segmentation pass onto already-rich text. It needs a real binary-extraction stage wired in first — either reusing the `programs/` extractors (`mammoth` for docx, `pdf-parse` for pdf) under the Source artifact registry, or standing up the equivalent in Source — and only then segments the extracted text into a `ContractClause[]`, each carrying `{ clauseType, headingPath, sourceLocation (page/section), verbatimText, extractedTerms }`. `clauseType` is drawn from a controlled taxonomy mirroring d28 §4 — `liability_cap`, `indemnification`, `data_residency`, `ip_ownership`, `security_obligations`, `sla_framework`, `termination`, `renewal`, `price_escalation`, `audit_rights`, `exit_assistance`. This is reasoning, not regex: the extractor must run as an analysis step (the Volume 2, Chapter 5 Analysis stage applied to a contract), emitting a Reasoning Envelope so that every extracted clause carries its `sourceLocation` citation — preserving the "source location evidence" standard the AGENTS.md context-ingestion contract demands for PDF/DOCX extraction. The binary-extraction stage is therefore the first piece of net-new build scope, not an assumed primitive.

**Standard-position comparison.** Each extracted clause is compared against a `StandardClausePosition` — the enterprise's preferred fallback (e.g. "liability capped at 12 months of fees"; illustrative). The comparison yields a `ClauseGap` with a deviation classification: `aligned`, `vendor_favorable_minor`, `vendor_favorable_material`, `missing`, `non_standard`. The renderer for this already exists and ships today: `src/lib/source/exports/renderers/ai-clause-gap.ts` (plus `ai-clause-gap-docx.ts`, `ai-clause-gap-html.ts`) and its payload builder `ai-clause-gap-payload.ts`. This is the chapter's leverage point: **the renderer is built; the reasoning that should feed it is not.** Today the payload binds to fixture or placeholder data. The specification is to wire `ai-clause-gap-payload.ts` to the live `ContractClause[]` and `ClauseGap[]` output of the extractor, so the AI Clause Gap report becomes a genuine artifact of contract reasoning rather than a template.

```
  UPLOADED CONTRACT (pdf/docx)
        │  artifact-registry/index.ts  (register, SHA-256, blob)
        ▼
  binary extraction  [NET-NEW · mammoth/pdf-parse from programs/, or new]
        │  ──► raw text + page/section anchors
        ▼
  ContractClauseExtractor   [NET-NEW · Analysis stage]
        │  emits ContractClause[] + sourceLocation citations
        ▼
  StandardClausePosition library  ──► clause-by-clause compare
        │
        ▼
  ClauseGap[]  (aligned · vendor_favorable · missing · non_standard)
        │                                   │
        ▼                                   ▼
  ai-clause-gap renderer            d28 contract record §4
  (SHIPPED — wire payload)          (Key clauses, now generated)
```

**Business value.** A clause-gap pass that surfaces "indemnification: vendor-favorable material — uncapped on third-party IP claims, page 41" is the difference between a legal reviewer who reads 90 pages under deadline pressure and one who is handed a triaged, cited deviation list and reviews the five clauses that matter. Cycle-time compression on legal review and a measurable reduction in adverse terms slipping through (illustrative range: legal review effort reduced 40–60%) are the prize.

### Liability, SLA & Commercial Verification

Clause-gap analysis compares the contract to a *generic* standard. The deeper, AbarVa-differentiating capability is **commitment verification**: comparing the contract against *what this specific deal negotiated and promised*. This is the cross-stage reasoning that no document-factory can do and that elite contract managers perform manually — reconciling the signed paper against the deal's own evidence trail.

**The verification model.** The engine ingests three deal-specific sources alongside the extracted clauses:

1. **The negotiated BAFO outcome** — the finalized concessions from `d23_bafo_round_log` (d28 §3 already instructs "Cross-reference `d23_bafo_round_log` for finalized concessions"). The BAFO engine (Volume 2, Chapter 7) produces the per-lever gives/gets and walk-away thresholds; verification checks that each *agreed* concession appears, enforceably, in the contract.
2. **The scorecard commitments** — capabilities and service levels the vendor *claimed* in their proposal and were *scored on* during evaluation (Chapter 6). A vendor scored highly on "24/7 follow-the-sun support, 15-minute P1 response" must have that bound in the SLA framework.
3. **The risk attestation** — `d25_risk_attestation` (`src/content/source-templates/executive_decision/d25_risk_attestation.md`), the artifact in which the executive decision packet records the risks the board accepted on the explicit assumption of certain contractual protections.

Verification is then a structured contradiction-detection pass producing a `CommitmentVerification[]`, each entry: `{ commitmentSource (bafo|scorecard|attestation), commitmentText, contractClauseRef, verificationStatus, evidenceCitations }`. `verificationStatus` ∈ `{ verified, weakened, absent, contradicted }`. The canonical example the system must catch:

> **Scorecard commitment:** "Tier-1 SLA — 99.95% availability, financially-backed."
> **Contract §SLA framework (page 38):** "Service provider shall use commercially reasonable best efforts to maintain availability."
> **Verification status: CONTRADICTED.** The financially-backed tier-1 commitment that drove the evaluation score has become an unenforceable best-efforts clause. Risk re-attestation required before signature.

**Grounding in real code.** The pattern library for this exists in seed form: `src/lib/source/commercial-risk-detection.ts` already encodes commercial-trap patterns (pricing traps, transition risk, supplier concentration). Contract verification extends this same detection discipline to clause-vs-commitment contradictions — it is the same "flag a pattern, attach evidence, quantify" machinery pointed at the signed paper rather than at vendor pricing. The verification finding is *not* a binary flag; following the Risk Philosophy (Volume 1, Chapter 4), each contradiction carries impact × probability × mitigability and an owner, and routes into `d25_risk_attestation` as a re-attestation trigger. A contradiction at `contradicted` severity should not be silently overridable: it is the contract-stage instance of the governed evidence-or-refuse posture — the system declines to assert "contract verified" while a material negotiated commitment is unbound, and surfaces the gap to Legal and the executive sponsor rather than rendering a clean d28.

```
  d23 BAFO round log ──┐
  scorecard (d16)  ────┼──► CommitmentVerification pass
  d25 risk attestation ┘        │  (extends commercial-risk-detection.ts)
                                ▼
     ┌──────────────────────────────────────────────┐
     │ verified · weakened · absent · CONTRADICTED    │
     └──────────────────────────────────────────────┘
        │ contradicted/absent (material)
        ▼
   re-attestation trigger ──► d25 risk attestation
   (block clean d28 render until resolved or waived)
```

**Why it matters / business value.** This is the single capability that converts Source from a document generator into a contract *guardian*. The negotiated value, the evaluation rationale, and the board's risk acceptance are all reconciled against the enforceable instrument before anyone signs. The value is asymmetric and tail-shaped: most of the time it confirms alignment cheaply; occasionally it catches the one uncapped-liability or downgraded-SLA term that would have cost multiples of the entire sourcing program's savings (illustrative range). It also closes the audit loop AGENTS.md requires — every verification finding carries file-level lineage (which clause, which page, which prior artifact it contradicts).

### The d28 Contract Record as Verification Output

Today d28 is a form to be filled. In the target state, **d28 is the rendered output of the verification reasoning pass** — documents are artifacts of reasoning. Each section is populated from a reasoning step, not hand-keyed:

| d28 Section | Today (stub) | Target — populated by | Reasoning source |
|---|---|---|---|
| §1 Contract reference | Manual | Registry metadata (`artifact-registry/index.ts`): blob URI, SHA-256, executed date | Ingestion lineage |
| §2 Term | Manual | Extracted `termination`/`renewal` clauses with auto-renewal & evergreen flags | ContractClauseExtractor |
| §3 Commercial terms snapshot | Manual | BAFO-verified pricing, escalators, price-hold, penalties | CommitmentVerification vs d23 |
| §4 Key clauses | Manual | ClauseGap inventory: IP, data residency, security, indemnification, exit | Clause-gap analysis |
| §5 Performance bonds / guarantees | Manual | Extracted bond/guarantee/insurance clauses + presence check vs attestation | ContractClauseExtractor |

Crucially, d28 carries an attached **Reasoning Envelope** (Volume 2, Chapter 5): the claims ("commercial terms match negotiated BAFO outcome"), the supporting evidence with citations (clause refs + prior-artifact refs), the assumptions tested ("assumed financially-backed SLA — REJECTED, contract says best-efforts"), and a confidence band. This is what makes d28 board-defensible. d28 relates to **d27 selection memo** as its downstream enforcement check: d27 (`src/content/source-templates/selection/d27_selection_memo.md`) records *why this vendor was chosen* — the risk-adjusted ranking and the conditions of award (Chapter 8). d28 then verifies *that the contract honors the basis of that choice*. A pre-award condition recorded in d27 ("award conditional on financially-backed tier-1 SLA") becomes a verification assertion in d28 ("contract binds financially-backed tier-1 SLA — VERIFIED" or, failing that, a blocking contradiction). The selection memo's conditions are the contract record's checklist; the two artifacts form a closed condition→verification loop.

### Contract Center UX & Outputs

The reasoning surfaces through a dedicated **Contract Center** under `src/app/(maestro)/source/` with components in `src/components/source/`, following the design-locked density contract (one row per item, status as color, detail one level down, forms reveal on click). It is not a document viewer; it is a triage and sign-off cockpit.

**Layout — three-pane verification cockpit:**

```
┌── CONTRACT CENTER · [Event] · stage S6 Contract ──────────────┐
│ Verification readiness: ● 3 contradictions · 5 vendor-favorable │
├───────────────┬──────────────────────────┬───────────────────┤
│ CLAUSE LEDGER │  CLAUSE / FINDING DETAIL  │ REASONING TRACE   │
│ (one row/each)│  (revealed on click)      │ (envelope panel)  │
│ ● Indemnity   │  Verbatim text · p.41     │ Claim · evidence  │
│ ● SLA  CONTRA │  vs standard position     │ Assumption tested │
│ ○ IP   aligned│  vs scorecard commitment  │ Confidence band   │
│ ● Renewal warn│  → re-attestation needed  │ Decision trace    │
└───────────────┴──────────────────────────┴───────────────────┘
   [Route to Legal sign-off]   [Request waiver]   [Render d28]
```

Color encodes verification status (red = contradicted/material, amber = vendor-favorable/weakened, green = aligned). Clicking a clause row reveals the verbatim contract text with its page citation alongside both comparison axes — standard position and deal commitment — and the reasoning trace renders the Reasoning Envelope (the cross-surface trace panel from Volume 3, Chapter 14). **Routing to legal sign-off** is the governance close: the Contract Center binds to the gate-criterion-state mutation path (`src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts`) and the governance enforcement layer (`src/lib/source/source-governance-enforcement.ts`). The Selection→Transition gate cannot be marked `met` while a `contradicted` material finding is unresolved; resolution is either a vendor redline (re-upload → re-verify) or an explicit, audited **waiver** carrying the approver, rationale, and accepted residual risk — wired to the same waiver workflow specified for the Selection engine (Chapter 8). Steward is the governing voice here: it does not author the contract, it refuses to certify d28 as verified on insufficient or contradicted evidence. (Sentinel remains the single front agent for Source; Steward, like Atlas and Nexus, is an internal governing voice surfaced in the trace, not a competing front-agent brand on the packet.)

**Outputs.** From the Contract Center, d28 renders through the existing export pipeline (`src/lib/source/exports/dispatch.ts` → `format-router.ts`), and the AI Clause Gap report renders via the already-shipped `ai-clause-gap` renderers. The board-grade requirement is that d28 and d25 (risk attestation) ship as signed PDFs. The PDF path itself is already built and live: `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-pdf/route.ts` imports `@react-pdf/renderer`, gates on `isPdfGeneratable(artifactCode)`, calls `renderArtifactPdf()`, and returns a print-ready PDF (`status: 200`) — but only for the four artifact codes wired today (`d05_scope_memo`, `d09_rfp_pack`, `d24_decision_brief`, `d27_selection_memo`); any code not yet wired returns **404** (not 501). The real gap for the contract stage is therefore neither a 501 nor an unbuilt route — it is **extending PDF coverage to the remaining artifact codes** (d28 and d25, alongside d25/d26/d28 generally) and adding signature blocks (a Volume 3, Chapter 15 dependency: extend the existing PDF route to those codes). Until those binders are added, d28 ships as docx via `narrative-docx.ts`.

**Implementation implications.** Contract Intelligence is a Phase 5 capability (Volume 4) and depends on three predecessors: (1) the Reasoning Envelope and Analysis stage (Phase 1), since clause extraction and verification are analysis passes; (2) live BAFO outcomes in d23 and scorecard commitments in d16 (Phases 2–3), since verification has nothing to reconcile against without them; (3) the waiver/gate-enforcement workflow (Phase 4). The net-new build is a binary-extraction stage (docx/pdf, reusing the `programs/` extractors or standing up the Source equivalent), the `ContractClauseExtractor` and `CommitmentVerification` reasoning modules, plus the Contract Center surface; the leverage is that the renderer (`ai-clause-gap`), the registry intake (`artifact-registry/`), the risk-pattern engine (`commercial-risk-detection.ts`), and the d28 template already exist — but the binary-extraction stage is genuinely new (the first-mile `text-parser.ts` handles only text/Markdown/CSV, not the binary pdf/docx contracts arrive as), so this is more than a wiring exercise.

---

---

## Chapter 10 — Transition Intelligence

> Volume 3 · Enterprise Architecture · Classification: Board-Grade, Confidential. Grounded against branch `codex/corpus-wave-24`.

### 10.0 Where Value Is Won or Lost

A sourcing event is not won at award. It is won — or quietly forfeited — in the ninety days after signature, when four years of incumbent operational knowledge has to cross a moving boundary into a new vendor without dropping a P1 incident, breaching an SLA, or stranding the institutional memory that nobody wrote down. The negotiated savings booked in Volume 2's BAFO engine are *promises*; transition is where the promise is either realized or eroded by parallel-run overrun, a knowledge gap that surfaces in month four, or an incumbent who has already mentally checked out. Elite operators (Bain delivery, ISG transition advisory) treat transition as a measured, gated program with rollback depth and continuity insurance — not a status meeting. AbarVa today does not. This chapter specifies how Source closes that gap.

The thesis of this specification — Source is a reasoning system that emits documents as artifacts of reasoning — applies with full force here. Transition Intelligence is not a Gantt chart renderer. It is a **continuously-scored readiness engine** that ingests transition evidence, reasons to a quantified go/no-go posture per checkpoint, monitors risk against blackout constraints, and emits `d29`–`d31` as the documentary residue of that reasoning. It then hands a clean, evidenced baseline to value realization (`d32`/`d33`), closing the lifecycle loop.

### 10.1 Current State — A Binary Heuristic Over Fixtures

The honest starting point is `src/lib/source/transition-readiness-view.ts` (358 lines). It is a **deterministic fixture view** — explicitly self-described as "no live clocks, no randomness, no network IO" — built over three hardcoded vendors (`vendor-a/b/c`) for the SRC-AMS-2026 demo event. `buildTransitionReadinessView()` returns per-vendor `checks[]`, a `risks[]` array of four seeded narratives, and seven `GO_NO_GO_CRITERIA` whose `met` flags are *all hardcoded `false`*. Its `transitionClearToBegin` boolean is computed as `goNoGoMetCount === goNoGoTotalCount` — a single binary collapse of a multi-dimensional readiness question, derived from constants, never from event state. The `honestDisclaimer` field says it plainly: live tracking, vendor check submission, and gate management are *deferred to the Source transition module (post-selection)* — which does not yet exist.

This is **PARTIAL, fixture-bound** (maturity 2 against the Volume 1 scale; an internal estimate, not an external rating). The view model, status taxonomy (`ready | partial | blocked | not_started | deferred`), and risk-severity scaffold (`high | medium | low`) are good bones. What is **ABSENT** is everything that makes it intelligence: no readiness *scoring* (binary `met`/not-`met`, never a weighted score with confidence), no knowledge-transfer *tracking* against evidence, no *continuous* risk monitoring (the four risks are static prose), no *blackout* model, and no connection to the live canvas substrate (`artifact_states`, `gate_criterion_states`, `evidence_states` in `src/lib/source/canvas-substrate/`) or to action routing via `src/lib/source/commercial-mission-queue.ts`. The three transition templates — `d29_transition_plan.md`, `d30_checkpoint_log.md`, `d31_kt_evidence.md` — are 34/26/26-line placeholder stubs with empty tables; none of the three is in the live generation set (only `d01/d05/d09` ship live templates in `prompt-registry.ts`). This chapter specifies the engine that replaces the heuristic and generates those three deliverables from reasoning.

### 10.2 Mandate & the Transition Readiness Scoring Model

**Why it matters.** A binary "clear to begin" answer is operationally useless: it cannot tell a CIO *how* unready, *where* the weakness sits, or *what one move* most improves the posture. Transition risk is asymmetric — a 70%-ready transition that begins on schedule with a known, insured gap can outperform a 95%-ready one that slips past the incumbent contract cliff. The board needs a *calibrated, decomposable* score.

**A note on stage span.** Transition readiness does not live in a single canonical stage. The canonical stage-pack scheme runs `S0_intake → S1_market_shape → S2_shortlist → S3_rfp → S4_demo_poc → S5_bafo → S6_contract → S7_activate`, and transition straddles the last two: contract terms (`S6_contract`) set the rollback and parallel-run obligations the engine scores, while cutover and knowledge-transfer completion land in `S7_activate`. (The UI's `source-shape-resolver.ts` uses a divergent S1/S3/S6/S7 labelling; this specification uses the canonical stage-pack scheme throughout.) To avoid drift, this specification fixes one convention: **the Transition Readiness Index is scored continuously from `S6_contract` and gated to clear in `S7_activate`** — KT and cutover semantics (`d29`–`d31`) span the boundary, but the go/no-go posture is anchored at `S7_activate`. Where later chapters anchor transition at `S7_activate`, they refer to this gate, not to the full span.

**What it solves.** It replaces the `transitionClearToBegin` boolean with a **Transition Readiness Index (TRI)** — a 0–100 score across four weighted dimensions, each carrying its own sub-score, evidence basis, and confidence band, surfaced through the Reasoning Envelope contract defined in Volume 2 (Ch 5).

**How it works.** The four dimensions extend the *checks* already modeled in `transition-readiness-view.ts` into a scored framework:

| Dim | Dimension | Default weight | What it scores | Evidence basis (from substrate) |
|---|---|---:|---|---|
| T1 | **KT plan maturity** | 30% | Are all phases of knowledge transfer planned, owned, scheduled — not just Phase 1? | `d29` §2 schedule + `d31` evidence rows; today `va-ktp` is "Phase 1 only" |
| T2 | **Parallel-run scope & cost** | 25% | Is the parallel-run window defined, cost-separated from steady-state, and budget-approved? | `d29` §3 gates + BAFO pricing split (`pricing-normalization.ts` transition dimension) |
| T3 | **Cutover sequencing** | 25% | Is the cutover ordered, dependency-mapped, with a confirmed timeline against the incumbent cliff? | `d29` §1 milestone roadmap + §4 critical path |
| T4 | **Rollback depth** | 20% | If cutover fails, how far back can we recover, how fast, at what cost? | `d29` §3 rollback criteria + `d30` go/no-go decisions |

```
            TRANSITION READINESS INDEX (TRI)
  evidence_states ─┐
  artifact_states ─┼─► [T1 KT maturity ·30] ─┐
  gate_states ─────┘   [T2 parallel-run ·25] ─┤
                       [T3 cutover seq ·25] ──┼─► Σ(score·weight) ─► TRI 0–100
  BAFO pricing ───────►[T4 rollback   ·20] ──┘        │
                                                       ├─► confidence band (multi-factor)
                                                       └─► binding constraint (lowest-scoring dim)
                              │
                              ▼
              Reasoning Envelope ──► d29 generation · go/no-go posture · UX
```

Crucially, TRI is **archetype-modulated**. The dormant Source Event Archetype Framework (`src/lib/source/types.ts` `archetype` field; `classifySourcingEvent()` in `classifier/category-classifier.ts`) must, when activated per Volume 2 Ch 5, drive the weights and thresholds here: an **AMS** transition (4 years of ops knowledge, the SRC-AMS-2026 case) weights T1 (KT) and T4 (rollback) heavily; an **AI-data-platform** transition weights T2 (parallel-run, data re-platforming) and T3 (cutover sequencing) more; a **renewal** archetype may legitimately score T1 near-complete because the incumbent stays. A single fixed weight vector — which is all the current view could ever express — is the wrong model. The weights are *data, keyed by archetype × estate*, consistent with the framework's two-axis resolver, not code.

**Expected business value (illustrative range).** Decomposed readiness lets a sponsor green-light a transition at, say, TRI 78 with a named, insured T2 gap rather than waiting for an unreachable 100 — compressing the post-award-to-go-live window by an estimated 2–4 weeks (illustrative range) and avoiding incumbent extension at premium rates. On the downside-protection side, surfacing a low T4 (rollback) score *before* cutover is the difference between a managed rollback and an unmanaged outage; one avoided P1-during-cutover event is worth more than the entire tooling cost (illustrative range).

**Implementation implications.** TRI replaces `buildTransitionReadinessView()`'s summary block. The function signature changes from zero-argument fixture to `buildTransitionReadinessView(eventId, ctx)` reading the live substrate via `canvas-substrate/queries.ts`. The `met: false` constants in `GO_NO_GO_CRITERIA` become derived from `gate_criterion_states` rows (`pending | met | not_met | waived | deferred`). `d29` generation is added to `prompt-registry.ts` as the fourth live template, consuming the TRI envelope so the plan's milestone roadmap and rollback criteria are *grounded in the same reasoning* that produced the score — not authored independently.

### 10.3 Knowledge-Transfer Tracking — From Checklist to Evidence Ledger

**Why it matters.** KT is the single highest-variance line in any AMS or platform transition, and the place where "looks done" diverges most from "is done." The current fixture flags `va-ktp` as "Phase 1 scope only; Phase 2 and 3 transfer milestones pending" — a real failure mode the model already anticipates but cannot track. Per the project's context-ingestion truth standard, "knowledge transferred" is not one state; it must be decomposed: *session scheduled → session held → content delivered → receiving-team verified competency → gap closed*.

**How it works.** `d31_kt_evidence.md` becomes a live **KT evidence ledger** rather than an empty table. Each session is a tracked row binding to the `evidence_states` substrate, advancing along the same readiness ramp used elsewhere in Source (`NotRequested → Loaded → Parsed → Available → UsableEvidence`, plus `Stale`/`LowConfidence` failure modes — see the readiness state contract in `canonical-specs/evidence-requirements.ts`). A KT session reaches "Usable Evidence" only when the **receiving-team attestation** (`d31` §2) is recorded — the lead confirming "competency to operate without vendor babysitting," in the template's own words. This is the evidence-or-refuse posture (net-new, wiring into `source-answer-engine.ts`) applied to transition: the engine *refuses* to score a KT track as complete on a held session alone; it requires the verifying attestation, and it surfaces open gaps (`d31` §3) as named, dated risks rather than absorbing them into a green checkmark.

```
KT TRACK STATE MACHINE (per track: ops/eng/governance/vendor-mgmt)
  scheduled ─► held ─► content delivered ─► [receiving attestation?]
                                                │ yes          │ no
                                                ▼              ▼
                                          Usable Evidence   gap flagged ─► d31 §3 open gaps
                                                │                         ─► risk monitor (T1)
                                                ▼                         ─► mission queue task
                                       feeds TRI · T1 score
```

`d30_checkpoint_log.md` (checkpoint log) sits above this: each checkpoint ("KT wave 1 complete") carries a go/no-go *decision record* — the missed-checkpoint protocol (`d30` §2: defer with new date · waive with rationale · trigger rollback, sponsor sign-off required). This is the governance spine — owned by the Steward internal voice, audit-visible per `d30` §3 — that makes a slipped KT wave a *recorded decision* rather than a silent slip. The decision rights mirror the gate-criteria model already in `gate-criteria.ts`: a checkpoint waiver is a `waived` gate state with a mandatory rationale and owner.

### 10.4 Risk Monitoring & Blackout Management

**Why it matters.** The current `TRANSITION_RISKS` array is four static narratives — incumbent-departure gap, CDP integration lock-in, parallel-run cost overrun, knowledge continuity. They are well-chosen, but they are *prose, scored once, monitored never*. Real transition risk is *temporal*: the incumbent-departure gap risk (severity `high` in the fixture) intensifies as the contract-expiry date approaches and the cutover slips; it is not a constant.

**How it works.** Risk monitoring promotes each static risk into a **live, re-scored monitor** under the Risk Philosophy of Volume 1 Ch 4 — impact × probability × mitigability, with an owner and a mitigation state. The four seed risks become the starting registry; each binds to a TRI dimension and a checkpoint, and is *re-evaluated whenever underlying state changes* (a checkpoint slips, an evidence row goes `Stale`, a gate flips). The incumbent-departure risk, for instance, is a computed function of `(incumbent contract end date − projected cutover date)`: as that margin narrows, probability rises and the monitor escalates — exactly the "confirm a 60-day extension option as a backstop" mitigation the fixture already names, now triggered by data rather than authored once.

**Blackout management** is the net-new capability with the sharpest operational edge. Every enterprise has windows in which cutover is forbidden — fiscal close, peak retail season, a frozen change-control period, a concurrent program's go-live. The engine maintains a **blackout calendar** as a first-class constraint: the cutover sequencing dimension (T3) is *invalid* if the planned cutover date lands inside a blackout, and the engine surfaces this as a hard conflict, proposing the nearest compliant window. This directly addresses the fixture's `tr-cdp-integration` risk — the AMS cutover must not land before the dependent CDP P3 Design gate clears; that dependency *is* a blackout on the AMS cutover until the gate is met.

**Action routing.** Detected risks and slipped checkpoints do not just display — they route. `commercial-mission-queue.ts` already defines a `transition_planning` mission type and a typed queue (`CommercialMissionQueueItem` with `priority`, `owner`, `blockedBy`, `status`). Transition Intelligence is its consumer: an escalating incumbent-gap risk emits a `risk_mitigation` mission owned by `buyer_team` ("confirm extension backstop"); an open KT gap emits a task owned by the receiving lead; a blackout conflict emits a `transition_planning` mission to re-sequence. The queue's existing `nextMission` resolver (highest-priority non-blocked queued item) becomes the Transition Center's "do this next" surface — connecting reasoning to action without a new orchestration layer.

| Risk monitor | Binds to | Trigger to escalate | Routed mission (queue) | Owner |
|---|---|---|---|---|
| Incumbent departure gap | T3, T4 | contract-cliff margin < 30d | `risk_mitigation` | buyer_team |
| Integration lock-in (CDP) | T3 | dependent gate unresolved at cutover-minus-window | `transition_planning` | steward |
| Parallel-run cost overrun | T2 | transition cost unseparated from steady-state | `governance_review` | steward |
| Knowledge continuity | T1 | KT track stuck below Usable Evidence | `evidence_collection` | sentinel |

### 10.5 The Transition Center & Handoff to Value

**The surface.** The Transition Center (Vol 3 Ch 14 specifies the component layer; this chapter specifies its intelligence) renders the TRI as the headline — a single decomposable score, not a binary — with the four dimensions as drill-downs, the live risk registry sorted by current severity, the blackout calendar with the proposed cutover window, and the `nextMission` from the queue as the prescribed action. It obeys the Source canvas density contract (one row per item, color carries status, forms reveal on click): each vendor's `checks[]`, each KT track, each checkpoint is one row whose color is its readiness state, expanding to the evidence and decision record one level down. Every number on the surface is traceable to its Reasoning Envelope — the UX expression of the OS thesis. Sentinel remains the single front agent across the Transition Center; the Steward owner labels above name internal voices in the mission queue, not competing front-agent brands.

**Handoff to value.** Transition closes the lifecycle loop. When the cutover checkpoint clears go/no-go (`d30`) and the KT ledger reaches Usable Evidence across all tracks (`d31`), the engine emits a **transition-complete baseline** that seeds value realization: `d32_value_ledger.md` inherits the negotiated savings targets from BAFO and the *actual* transition cost (including the now-itemized parallel-run split), establishing the variance baseline against which realized value is measured; `d33_governance_review.md` inherits the full audit trail of checkpoint decisions, waivers, and risk closures. The transition's residual open gaps (`d31` §3) carry forward as the first entries in the value-phase watch-list. This is the structural answer to a standing gap noted internally — that no path today connects "contracted value commitments to measured realization." Transition Intelligence is that connective tissue.

**Implementation summary.**

| Change | Seam (real file) | From → To |
|---|---|---|
| TRI scoring | `transition-readiness-view.ts` | fixture boolean → live 4-dim weighted index over substrate |
| Archetype-keyed weights | `classifier/category-classifier.ts`, `types.ts` | dormant → drives T1–T4 weight vector |
| Live go/no-go | `canvas-substrate/queries.ts` | hardcoded `met:false` → derived from `gate_criterion_states` |
| KT evidence ledger | `evidence-requirements.ts`, `d31` template | empty table → readiness ramp with attestation gate |
| `d29`/`d30`/`d31` generation | `agent-generation/prompt-registry.ts` | stubs → live templates fed by TRI envelope |
| Risk monitors + blackout | `commercial-risk-detection.ts` (seed patterns) | static prose → re-scored temporal monitors |
| Action routing | `commercial-mission-queue.ts` | unused `transition_planning` type → live consumer |
| Value handoff | `d32`/`d33` templates | no link → transition-complete baseline seed |

This is not greenfield. The view model, the status taxonomy, the four risks, the seven go/no-go criteria, the mission queue, the evidence ramp, and the deliverable templates all exist. Transition Intelligence is the act of converting them from a deterministic demo fixture into a scored, monitored, evidence-gated engine — and in doing so, of ensuring the value Volume 2 negotiates is actually the value Volume 4 measures.

---

---

## Chapter 11 — Market Intelligence Layer

> Volume 3 · Enterprise Architecture · Classification: Board-Grade, Confidential. Grounded against branch `codex/corpus-wave-24`.

### 11.0 Position in the OS

Volume 2 built the engines that reason about a sourcing event — evaluation, BAFO, selection. Chapters 9 and 10 built the engines that reason about the contract and the transition. Every one of those engines reasons against *internal* truth: the bound context for one event, the canvas substrate for one tenant, the evidence loaded for one decision. That is necessary and it is not sufficient. An elite sourcing operator never reasons only from what the client told them. They reason from what the *market* is doing — what this vendor charges three other clients, where the AMS rate card actually clears, which AI-platform vendors have a credible roadmap versus a slide, what a comparable ERP-SI deal closed at after BAFO. Chapter 11 specifies the **Market Intelligence Layer**: the externally-sourced brain that turns Source from internally-calibrated reasoning into *market-calibrated* reasoning.

This is the layer Source most conspicuously lacks. The thesis of this chapter is blunt: without a market brain, every recommendation the OS produces is anchored to conservative internal defaults, and a conservative default in a negotiation is a gift to the vendor.

### 11.1 Why Source Needs a Market Brain

**Why it matters.** The single highest-leverage moment in any sourcing event is the gap between what a buyer *thinks* a thing should cost and what the market *knows* it costs. McKinsey/Kearney sourcing practice quantifies that gap routinely — savings of 8–18% (illustrative range) on managed-services renewals come almost entirely from arriving at the table with a calibrated should-cost and a credible benchmark, not from harder bargaining. The intelligence is the leverage.

**What problem it solves.** Today the OS reasons in a vacuum on three axes:

1. **Vendor truth.** The live pipeline (`context-binder.ts` → `prompt-registry.ts` → `server.ts`) knows only what the buyer's context contains about a vendor. It has no independent vendor profile — no capability map, no reference base, no financial-health signal, no AI-maturity assessment. The commercial layer (`vendor-selection-readiness.ts`, `award-decision-view.ts`) is PARTIAL and fixture-bound — it reasons over `vendor-a/b/c` fixtures, not market-grounded vendor entities.
2. **Price truth.** `should-cost-model.ts` models the full TCO iceberg honestly — it returns a *range* with the seven hidden layers itemised rather than a point estimate. But its rate-card and role-mix assumptions are internal constants, and the module is imported and called by the dormant `source-answer-engine.ts` (so it has a call-site there) yet is never reached by the live generate-route deliverable pipeline (§11.3). Its sibling `pricing-normalization-model.ts` decomposes vendor quotes into towers and roles but has nothing external to *compare them against*. Both compute against defaults, and defaults skew conservative.
3. **Pattern truth.** `intelligence-patterns.ts` detects ten commercial patterns (`pricing_compression`, `bundling_trap`, `scope_creep_setup`, …) but does so from six internal boolean flags (`hasOpaquePricing`, `hasBroadScope`, …). It can tell you a vendor *is* anchoring on broad scope; it cannot tell you whether that anchor is unusual relative to how this vendor behaves across the market.

**How a market brain fixes it.** The Market Intelligence Layer is a distinct knowledge tier — analogous to a Gartner/Everest/ISG analyst desk rendered as data — sitting *beside* the per-tenant context layer, never inside it. It supplies four asset classes: **Vendor Profiles**, **Peer Benchmarks**, **Pricing/Savings Intelligence**, and **AI-Capability Profiles**. The engines of Volumes 2–3 consume these as additional grounded inputs to the Reasoning Envelope, so a vendor ranking carries a market-calibrated capability score, a should-cost carries a market clearing band, and a negotiation strategy carries a "this vendor concedes here" prior.

**Expected business value (illustrative ranges).** Market-calibrated should-cost typically recovers 8–18% on renewals and 5–12% on new managed-services awards; benchmark-anchored BAFO closes the "leave money on the table" gap that internal-default pricing creates, estimated at 3–9% of contract value. The defensibility argument for investors: vendor profiles and accumulated savings intelligence are a *data moat* that compounds with every event run — the reasoning IP gets sharper the more the OS is used.

**Implementation implications.** This is net-new infrastructure with a clean seam: it must enter through the broker boundary (§11.5), never through direct imports, and it must respect the firewall between market data (cross-tenant, non-privileged) and client data (tenant-scoped, RLS-governed). Market intelligence is never legal-privileged client work-product — it is curated cross-tenant analyst data — so it needs its own non-privileged classification at the market-layer boundary rather than borrowing the shipped privilege classifier, which has no market/non-privileged asset lane (§11.5).

### 11.2 Vendor Profiles & AI-Capability Assessment

**The entity.** Specify a first-class `VendorProfile` market entity (net-new; the natural home is a new `src/lib/source/market-intelligence/vendor-profile.ts` consumed via the broker, NOT a per-event fixture extension of `cat-pattern-instances.ts`). Its shape:

```
VendorProfile
├─ identity        canonical vendor id, aliases, segment (AMS / ERP-SI / AI-platform / niche)
├─ capabilities[]  capability map → maturity 1–5, evidence refs, last-verified date
├─ references[]    named/anonymized client refs, outcome, recency, verification status
├─ financials      health band, scale band, concentration risk, source + as-of date
├─ aiMaturity      AICapabilityProfile (see below)
├─ behaviorPriors  negotiation tendencies: where this vendor concedes / anchors
└─ provenance      source desk (analyst / corpus / human-curated), confidence band, freshness
```

Every field carries provenance and a freshness timestamp. This is non-negotiable: a vendor profile with stale financials is worse than none, because it launders an old fact into a confident recommendation. The Reasoning Envelope (Vol 2, Ch 5) must surface profile freshness in its caveats.

**The AI-Capability Profile.** AI maturity is the differentiating axis for the modern sourcing event and the one analysts assess most crudely. Specify an `AICapabilityProfile` sub-entity scoring a vendor on: model/IP ownership vs reseller posture; deployment evidence (production references vs roadmap slides); data-handling and governance posture; and roadmap credibility. This maps directly onto the `AI-data-platform` archetype in the (DORMANT) Source Event Archetype Framework — the `archetype` field in `types.ts` plus `classifySourcingEvent()` in `classifier/category-classifier.ts`, invoked only inside the dormant `source-answer-engine.ts` and its fixtures, never in the live deliverable-generation pipeline. When an event classifies as `AI-data-platform`, the evaluation engine weights `AICapabilityProfile` heavily; for an `AMS` renewal it weights references and financial stability.

**How it feeds the engines.** Two consumption seams:

- *Evaluation* (Vol 2, Ch 6): the multi-rater scoring engine ingests `capabilities[]` and `aiMaturity` as a market-calibrated rater alongside the buyer's internal ratings, so a vendor's self-claimed capability is scored against the market's independent view. Divergence becomes a flagged claim in the Reasoning Envelope.
- *BAFO leverage* (Vol 2, Ch 7): `behaviorPriors` feed the leverage/EV model. A vendor whose profile shows a consistent concede-on-transition-fees pattern changes the expected-value calculus of where to push. This is the entity that finally gives `bafo-negotiation-model.ts` something market-grounded to reason with instead of fixture priors.

**Implementation implications.** Vendor profiles are cross-tenant assets but must be *consumed* tenant-scoped — a profile is read for an event, never written back into a tenant's context layer (that would leak market data into client-governed data and corrupt the lineage). Curation is a governed admin function (Steward voice), separate from the client-data ingestion contract in AGENTS.md: profiles enter through a market-intelligence admin lane, not the Admin bulk loader.

### 11.3 Benchmarks, Pricing & Savings Intelligence

**Why it matters.** This is where the market brain converts directly into dollars at the table. The engines that need it already exist and are starved.

**The benchmark entity.** Specify a `BenchmarkSet` keyed by (segment, tower, role, geography, deal-size band) returning a clearing distribution — not a point, a distribution with p25/median/p75 and an `n`/confidence band:

```
BenchmarkSet { segment, tower, role, geo, sizeBand }
  → { p25, median, p75, currency, n, asOf, confidenceBand, provenance }
```

**Calibrating should-cost.** `should-cost-model.ts` today blends internal rate constants across its `ShouldCostRole` taxonomy and itemises the TCO iceberg against fixed hidden-layer ratios. Specify a calibration seam: the model accepts an optional `BenchmarkSet` injection that overrides its role-rate constants and hidden-layer ratios with market-clearing values for the event's segment/geo. The output stays a *range* (preserving the module's honest "never a single number" contract) but the range is now market-anchored, and the Reasoning Envelope records which benchmark calibrated it. Critically, this is also the moment to settle the module's wiring. Despite the module's own header comment still literally reading "Standalone — NOT wired into source-answer-engine.ts (separate follow-up)," the dormant `source-answer-engine.ts` already imports `should-cost-model.ts` (import line 22) and calls `estimateEventShouldCost` from it (around line 191) — so it does have a call-site there; that stale header comment should be corrected so a skeptical reviewer is not tripped by the contradiction. Either way, the module is **not** reached by the live generate-route pipeline today — it is reachable only through the DORMANT engine. The calibration work and the engine activation should therefore ship together so a calibrated should-cost actually reaches a deliverable on the live path.

**Calibrating pricing normalization.** `pricing-normalization-model.ts` decomposes each vendor quote into `PricingTower`/`PricingRole` lines and statuses (`comparable`, `needs_clarification`, `split_required`). Specify that each normalized line gets scored against the matching `BenchmarkSet`: a line clearing above p75 is flagged `above_market`, below p25 `below_market_verify` (a too-good price is a scope-gap signal, not a win). This turns normalization from a *comparability* exercise into a *competitiveness* exercise — the difference between "these quotes are comparable" and "vendor B's application-management tower is 22% (illustrative range) above market median."

**Savings intelligence.** Specify a `SavingsLedger` that accumulates realized-savings outcomes from completed events (anonymized, cross-tenant) keyed the same way as benchmarks. This is the compounding moat: every event that closes feeds the ledger, which tightens the next event's benchmark confidence band. It also grounds the value-realization deliverables (`d32` value ledger, `d33` governance review) in *market-relative* savings claims rather than internal before/after arithmetic.

| Asset | Grounds which engine | Replaces today's | Net effect |
|---|---|---|---|
| `VendorProfile` | Evaluation (Ch 6), BAFO leverage (Ch 7) | vendor-a/b/c fixtures | market-calibrated capability + concede priors |
| `AICapabilityProfile` | Evaluation, AI-platform archetype weighting | absent | credible-vs-slideware AI scoring |
| `BenchmarkSet` | should-cost, pricing-normalization | internal rate constants | market clearing bands, above/below-market flags |
| `SavingsLedger` | value deliverables d32/d33, benchmark confidence | internal before/after | compounding savings moat |

### 11.4 Pattern Grounding & Semantic Retrieval Upgrade

**Why it matters.** The market brain is only as good as the OS's ability to *retrieve the right slice of it* for the event at hand. Today retrieval is lexical, and lexical retrieval silently misses the relevant intelligence whenever the buyer's language and the market's language diverge — which is almost always.

**Current behavior (grounded).** Sentinel's pattern matching in `src/lib/sentinel/orchestrator.ts` is keyword/token-based. `scorePattern()` (line 103) builds a set of `haystack` blobs from the pattern's name, slug, category, descriptions, trigger symptoms, detection signals, diagnostic questions, interventions, observations and section bodies, then scores in three layers: a slug/name **containment** bonus (`normalized.includes(pattern.slug…)` / `…name…`, +36, line 121); a **token-overlap** pass that tokenizes the message and adds +8 for every token that hits any haystack (line 125); and a handful of **regex boosts** over the message (`/(evidence|citation|source|proof…)/`, line 129, plus vendor/risk tests). It is lexical end to end — token overlap and substring containment, never semantic similarity. The corpus seam `searchIndustryScopedCorpusPatternIndex()` routes through `searchCorpus()` — Postgres full-text, not vectors. The Source-side `intelligence-patterns.ts` detector is even coarser: it fires on six pre-computed booleans. Three consequences: (1) a vendor describing "elastic capacity bursting" never matches a pattern keyed on "scope creep" because no token overlaps; (2) `evidenceCount` is read once per render (`getPatternEvidenceMetrics`, `pattern-manifest.ts:175`) rather than tracked live; (3) the `cat-pattern-instances.ts` fixtures had to be hand-tuned to "share ≥2 non-stop-words with each pattern's contradiction templates" — the fixtures are bent to fit the matcher, which is the matcher confessing its own brittleness.

**The upgrade.** Specify a three-part move:

1. **Embedding-based semantic retrieval.** Replace the `scorePattern` token-overlap scoring with vector similarity over pattern embeddings, keeping the existing signal boosts (demoCritical, anchor-slug, evidence-presence) as a *re-ranking* layer on top of semantic candidates rather than as the primary matcher. The platform already has the cutover vehicle: the `retrieval_azure_search` feature flag in `src/lib/features/registry.ts:84` routes broker tenant-context retrieval through Azure AI Search instead of pgvector, staged tenant-by-tenant (its `includeTenants` allowlist is intentionally empty, default off everywhere). Pattern retrieval should ride the same flag key and the same staged-allowlist discipline — default off, prove per tenant, cut over.
2. **Live evidence-count updates.** Make `evidenceCount`/`observationCount` a tracked quantity that updates as evidence is loaded against an event (driven off the canvas substrate `evidence_states`), so a pattern's market relevance reflects current evidence, not a render-time snapshot. This feeds the reasoning engine's confidence bands directly.
3. **Retire the boolean detector.** Re-express `intelligence-patterns.ts`'s ten categories as semantic detectors grounded in vendor-profile behavior priors and benchmark deviations, so `pricing_compression` fires from an actual below-p25 benchmark deviation rather than a hand-set `hasOpaquePricing` flag.

**Why semantic, specifically.** The intelligence in a market brain is written in analyst/vendor language; the buyer's event is written in buyer language. Lexical matching forces an exact-vocabulary collision that rarely happens, which is precisely why the fixtures had to be bent. Semantic retrieval matches on *meaning*, which is the only way externally-sourced intelligence reaches an event whose author never used the market's words.

### 11.5 The Externally-Sourced Brain & the AgentContextBroker Boundary

Two hard architectural rules govern this entire layer.

**Rule 1 — Market data is a separate knowledge layer from client context.** The per-tenant context/corpus layer is client-governed, RLS-scoped, and lineage-tracked under the ingestion truth standard (AGENTS.md). The market brain is cross-tenant, analyst/curator-governed, and explicitly *non*-privileged. These must never commingle: market intelligence is read *into* an event's reasoning, never written *into* a tenant's context rows. Mixing them would both leak cross-tenant market data into a client's governed corpus and pollute the should-cost/benchmark provenance with one client's quotes. Note the firewall here is *not* the shipped disclosure-flag classifier — that classifier (`disclosure-flag/`, SHIPPED) tags attorney-client/work-product privilege on *client* artifacts and propagates that privilege downstream; it has no market/non-privileged asset lane. The market layer needs its own boundary-level non-privileged classification at the broker, stamping market assets as cross-tenant and disclosable, rather than borrowing a privilege classifier whose purpose is the opposite problem.

**Rule 2 — All access goes through the AgentContextBroker contract.** Per the knowledge-layer broker boundary, the app tier must never directly import market-intelligence internals any more than it may import the EnterpriseDataRoom or vector store. Vendor profiles, benchmarks, and savings intelligence are resolved through the `AgentContextBroker` seam (the same contract that already fronts `genome-query-broker.ts` and tenant-context retrieval). Concretely: the evaluation and BAFO engines request `VendorProfile`/`BenchmarkSet` *via the broker*, the broker enforces the market-vs-client firewall and stamps provenance/freshness, and the engines receive market-grounded inputs they can place directly into the Reasoning Envelope.

```
   ┌──────────────── Market Intelligence Layer (cross-tenant, non-privileged) ─────────────┐
   │  VendorProfile · AICapabilityProfile · BenchmarkSet · SavingsLedger · Pattern embeddings │
   └───────────────────────────────────────────┬──────────────────────────────────────────┘
                                                │  (resolve, with provenance + freshness + firewall)
                                   ┌────────────▼─────────────┐
                                   │   AgentContextBroker      │  ← single seam; app tier never bypasses
                                   └────────────┬─────────────┘
              ┌─────────────────────────────────┼─────────────────────────────────┐
              ▼                                  ▼                                 ▼
     Evaluation Engine (Ch6)           BAFO / should-cost (Ch7)         Sentinel semantic retrieval (§11.4)
     market-calibrated capability      benchmark-anchored ranges        embedding match → re-rank
              └─────────────────────────────────┬─────────────────────────────────┘
                                                 ▼
                                        Reasoning Envelope  →  Deliverable (d01–d33)
              (claims carry: market source · confidence band · freshness · non-privileged tag)
                                                 ▲
   Tenant Context/Corpus Layer (RLS, privileged) ┘  — separate broker path; NEVER commingled with market data
```

**Walkthrough.** An `ERP-SI` event reaches evaluation. The engine asks the broker for the shortlisted vendors' profiles and the matching ERP-SI benchmark set. The broker resolves them from the market layer, stamps each with provenance, freshness and a boundary-level non-privileged tag, and enforces that nothing from the buyer's privileged context is mixed in. Evaluation scores vendor claims against market capability; should-cost calibrates its iceberg to the benchmark band; BAFO loads the vendors' concede-priors. Every market-derived value lands in the Reasoning Envelope as a claim with its source and freshness, so the executive decision packet (`d24`–`d26`) can show not just *what* the OS recommends but *what market truth* it stood on. The tenant's context layer, reached on a separate broker path, supplies the client-specific evidence — and the two never touch.

**Net.** The Market Intelligence Layer is the difference between an OS that reasons well about what it was told and one that reasons well about what is *true in the market*. It is the asset that compounds, the moat that deepens with use, and — wired through the broker with the firewall intact — the one external brain Source can safely trust.

---

---

## Chapter 12 — Agent Architecture

> Volume 3 · Enterprise Architecture. Grounded against branch `codex/corpus-wave-24`. Classification: Board-Grade, Confidential.

Volume 2 specified the engines that reason — Evaluation, BAFO, Selection. This chapter specifies the **agents** that wear those engines: the operating personalities a CXO actually converses with, the function-named specialists working behind them, and the coordination fabric that lets a recommendation move from one engine to the next without losing its evidence or its caveats. The thesis of the whole document — that Source is a sourcing intelligence operating system, not a document factory — lives or dies in this layer. An OS that reasons but cannot *present* its reasoning as a single, trustworthy voice with clear decision rights is just a pile of clever functions. This chapter is how the reasoning becomes an interlocutor.

The chapter builds directly on what already exists. The orchestrator `src/lib/source/sentinel-source-orchestrator.ts` already composes a single Sentinel-voiced briefing from seven deterministic specialist builders. The type contract `src/lib/source/multi-agent-types.ts` already defines `SentinelSourceBriefing`, `SpecialistContribution`, and the four agent names. The mission layer `src/lib/source/agent-mission-report.ts` already counts, prioritizes, and routes missions across `nexus | sentinel | atlas | steward`. The work of this chapter is not to invent an agent layer — it is to **promote the existing deterministic frame into an engine-backed, decision-empowered, escalation-aware agent architecture**, and to do so at the named seams.

### 12.1 The One-Front-Agent Doctrine

**Why it matters.** Procurement transformation fails most often not on analytics but on *trust legibility*: a CXO confronted with four chat personas, three dashboards, and a scorecard that disagrees with the executive memo cannot tell which voice owns the answer. The founder feedback captured across this program is unambiguous — one front agent per product, specialists function-named and hidden behind it, every click a decision and not a form-fill. Source's front agent is **Sentinel**. Nexus fronts Moves; Atlas fronts Tower; Steward is the governance voice. Inside Source, Nexus, Atlas, and Steward are not separate chat surfaces the user toggles between — they are *internal contributors* whose findings Sentinel synthesizes and speaks.

**What problem it solves.** It collapses N agent surfaces into one accountable voice while preserving the multi-disciplinary reasoning underneath. The user sees Sentinel; the trace drawer reveals which specialist shaped which sentence.

**How it works (today, real code).** `buildSentinelSourceBriefing()` (orchestrator, line 290) calls `buildSourceMultiAgentBriefing()` to produce the four internal voices, wraps seven specialist builders around them (`buildContextValidationChecker`, `buildEvidenceGapDetector`, `buildNextActionRecommender`, `buildMinimumDataRequestGenerator`, `buildValueAtStakeSummarizer`, `buildExecutiveDecisionBriefWriter`, `buildWorkflowBlockerDetector`), ranks them by `SPECIALIST_PRIORITY` (`steward:0 > sentinel:1 > nexus:2 > atlas:3`, line 22), and composes a single `primaryVoice` via `composePrimaryVoice()`. The Sentinel voice is then drift-checked against `checkSentinelVoice()` from `src/lib/agent/voice-doctrine/sentinel.ts` — cite, label claims verified/asserted/inferred, lead with the gap, never fabricate a move — with violations surfaced as `[voice-drift:...]` evidence notes (line 262). The voice-doctrine modules (`sentinel.ts`, `nexus.ts`, `atlas.ts`, `steward.ts`) all live under `src/lib/agent/voice-doctrine/`, not under a `src/lib/source/agent/` path. This is the doctrine in working form. The gap is that every specialist builder is **deterministic prose assembly over the context bundle**; none yet calls an engine.

**The agent contract.** Every agent in this chapter is specified against one contract, so the architecture is uniform and a new agent can be added without inventing a new shape:

| Contract field | Meaning | Backing type |
|---|---|---|
| **Mission** | The one question this agent owns | `SourceAgentMission.missionType` |
| **Inputs** | What it consumes to reason | `SourceAgentContextBundle` + engine outputs |
| **Outputs** | A Reasoning Envelope (Ch5), never raw prose | `SourceAgentBriefing` extended with envelope |
| **Decision rights** | What it may decide vs. recommend vs. block | new `decisionRights` field on the contract |
| **Escalation rules** | When it must hand to a human | `handoffRecommendation` → state machine (§12.5) |

**Business value (illustrative range).** Consolidating to one front agent is the difference between a tool a CXO abandons after the demo and one that becomes the standing interface to a sourcing event. The legibility tax of multi-agent UIs is real; collapsing it is expected to lift advisory-board confidence and reduce time-to-first-decision materially (illustrative range: 20–35% faster decision cycles once the engines back the voice).

**Implementation implication.** No new chat surface. The seam is the existing `primaryVoice` composition in the orchestrator; the change is that each specialist builder stops assembling prose and starts consuming an engine output (Reasoning Envelope) — described per agent below.

### 12.2 Atlas, Sentinel & Steward — Governance and Value Voices

Three of the four internal voices are not engine agents; they are the *posture* agents — they shape how every engine output is framed, valued, and governed. Their decision rights are the spine of the trust model.

```
                    ┌─────────────────────────────────────────┐
   USER  ◀────────▶ │  SENTINEL  (front agent · synthesis)      │
                    │  speaks the single board-grade read       │
                    └───────────┬───────────────────────────────┘
                                │ composes & ranks (priority order)
        ┌───────────────────────┼───────────────────────┬──────────────────┐
        ▼                       ▼                       ▼                  ▼
  ┌───────────┐         ┌───────────────┐       ┌──────────────┐   ┌────────────┐
  │  STEWARD  │  pr 0   │   SENTINEL    │ pr 1  │    NEXUS     │   │   ATLAS    │
  │ governance│ ◀blocks │ evidence/     │       │ action /     │   │ value /    │
  │  gate     │         │ validation    │       │ next-step    │   │ executive  │
  └─────┬─────┘         └───────┬───────┘       └──────┬───────┘   └─────┬──────┘
        │ may BLOCK             │ may REFUSE           │ may RECOMMEND     │ may FRAME
        ▼                       ▼                      ▼                   ▼
   gate-criterion        evidence-or-refuse       next-action         value-at-stake
   enforcement           (Ch5 governed answer)    recommendation      (no "realized"
   (source-governance-                                                w/o measurement)
    enforcement.ts)
```

**Steward (decision right: BLOCK).** Steward owns governance enforcement. In the current code Steward is the highest-priority specialist (`steward:0`) and fronts `buildWorkflowBlockerDetector` (orchestrator line 333, mission type `workflow_blocker`). Its primary finding today reads `'Workflow gates contain blockers that must remain enforced'` when `workflowValidationReport.failedExpectations` is non-empty. The target promotes this from *detecting* blockers to *enforcing* them: Steward's `cannotProceedReasons` must become a hard precondition wired into `evaluateStagePromotionReadiness()` in `src/lib/source/source-governance-enforcement.ts` and the gate-criterion state mutation route `/api/v1/source/[eventId]/gate-criteria/[criterionId]/state`. Steward can block; it cannot author content. This is the only agent with a true veto, and that veto is the governance backbone. Critically — per the VERIFIED GROUND TRUTH — Source has **no refusal mechanism today**; `disclosure-flag/` is a shipped legal-privilege *classifier* (attorney-client / work-product inheritance), not a governance refusal. The evidence-or-refuse posture is net-new and is wired through Steward into the dormant `source-answer-engine.ts`, not through `disclosure-flag/`.

**Sentinel (decision right: REFUSE).** Sentinel owns evidence sufficiency and synthesis. It is both the front voice (§12.1) and an internal contributor via `buildContextValidationChecker` and `buildEvidenceGapDetector`. Its decision right is *refusal*: when `contextValidationReport.suite.verdict !== 'pass'` or `citationCoverage.missingCitationClaims` is non-empty, Sentinel declines to present a recommendation as decision-grade and instead surfaces the gap. This is the operationalization of the Confidence and Governance philosophies from Volume 1, Chapter 4 — Sentinel refuses to launder thin evidence into confident prose. It does not block stage advancement (that is Steward); it refuses to *speak with confidence*.

**Atlas (decision right: FRAME, never inflate).** Atlas owns value framing and the executive register. It fronts `buildValueAtStakeSummarizer` and `buildExecutiveDecisionBriefWriter`. Its single hard constraint is encoded in the existing code and must be preserved: Atlas **cannot label value as realized without measurement evidence** (`valueLabel()` returns `'projected' | 'seeded' | 'realized'`, and `buildValueAtStakeSummarizer` sets `cannotProceedReasons: ['Atlas cannot label value as realized without measurement evidence.']` when the label is not `realized`, line 174). Atlas frames the prize; it may never claim a prize that has not been measured. This is the value-discipline guardrail that keeps the executive cockpit honest.

| Voice | Owns | May decide | May NOT do | Controlling file |
|---|---|---|---|---|
| Steward | Governance gates | Block advancement | Author deliverable content | `source-governance-enforcement.ts` |
| Sentinel | Evidence + synthesis | Refuse a confident answer | Block a gate; fabricate | `agent/voice-doctrine/sentinel.ts` |
| Atlas | Value + exec framing | Frame value at stake | Label value realized w/o measurement | orchestrator `buildValueAtStakeSummarizer` |
| Nexus | Action sequencing | Recommend next action | Bypass a Steward block | orchestrator `buildNextActionRecommender` |

### 12.3 The Engine Agents — Evaluation, Negotiation, Selection

These three are the reasoning workhorses. Each is the *agent face* of a Volume 2 engine, and each emits a Reasoning Envelope (Ch5) rather than prose. Today their backing engines are PARTIAL and fixture-bound (`bafo-negotiation.ts`, `award-decision-view.ts`, `scorecard.ts` are deterministic builders over `vendor-a/b/c` fixtures with no live call-site); the agent contract here specifies how they become live, evidence-anchored contributors behind Sentinel.

**Evaluation Agent.**
- *Mission:* produce defensible, consensus-weighted vendor rankings with deviation flags. Mission type extends `data_readiness`/`evidence_gap`.
- *Inputs:* parsed vendor responses, scorecard criteria and weights (`scorecard.ts`, d16/d17), evidence states from `canvas-substrate`. Note: `artifact-registry/text-parser.ts` is the synchronous first-mile parser for *text-like* uploads only (pasted notes / Markdown / text / CSV; parser id `source_text_first_mile_v1`) — it does **not** read binary vendor documents. Rich binary parsing (docx/pdf/xlsx response packs) is a net-new capability for Source: it must be built, or reuse the Moves-side async pipeline under `src/lib/programs/` (`doc-parser`, `attachments/extract-text`). The Evaluation Agent's response-parsing input depends on standing that up, not on extending `text-parser.ts`.
- *Outputs:* a Reasoning Envelope carrying per-criterion scores, weighted aggregate, >5-point deviation flags, and evidence citations for each score (d16/d18 generation, Ch6).
- *Decision rights:* RECOMMEND rankings; FLAG deviations requiring re-rate. It cannot disqualify a vendor unilaterally — disqualification (d18) is a recommendation that Steward must clear.
- *Escalation:* when score deviation exceeds threshold or evidence sufficiency falls below band, escalate to a human calibration session rather than auto-resolving.

**Negotiation Agent (BAFO).**
- *Mission:* generate per-vendor leverage analysis, concession strategy, and expected-value scenarios.
- *Inputs:* normalized pricing (`pricing-normalization.ts`; note d19 (`d19_pricing_workbook`) is the only canonical pricing code — any d19a/d19b/d19c decomposition is a set of *proposed net-new sub-artifacts, not in the 33-code canon*), evaluation rankings, competitive-tension and incumbency signals (`commercial-signals.ts`).
- *Outputs:* Reasoning Envelope with leverage state, concession ladder, walk-away threshold, EV by scenario (conservative/base/stretch), each carrying caveats. Backs d22/d23 generation.
- *Decision rights:* RECOMMEND negotiation moves and walk-away points; never *commit* to a vendor or send vendor communications (the memory record is explicit: vendor comms are DRAFT-only).
- *Escalation:* a walk-away recommendation, or any concession crossing a value-at-stake threshold, escalates to the sponsor with Atlas framing the executive air-cover.

**Selection Agent.**
- *Mission:* assemble the risk-adjusted award recommendation and the board decision packet (d24–d27). (The d24 template ships titled "Atlas Decision Brief" in the repo, and some d-codes name Nexus/Steward; per the one-front-agent doctrine these resolve to Sentinel as the single front voice on the packet, with Atlas/Nexus/Steward as internal contributing voices — not three competing front-agent brands.)
- *Inputs:* evaluation rankings, BAFO outcomes, commercial risk patterns (`commercial-risk-detection.ts`), transition-risk signals.
- *Outputs:* Reasoning Envelope with ranked options, pre-award conditions, recommendation-level confidence band, dissent capture. Promotes `award-decision-view.ts` and `executive-decision-summary.ts` from fixture derivation to live.
- *Decision rights:* RECOMMEND an award with conditions; it has **no authority to award**. The award is a human sign-off enforced by Steward through the approval/waiver workflow (Ch8). This separation is non-negotiable — the AI never self-approves a gate (the R8 governance principle).
- *Escalation:* a recommendation below a confidence band, or a tie within margin, escalates to the executive committee with the dissent captured.

Each engine agent maps cleanly to an internal voice for synthesis: Evaluation and Negotiation findings flow through Nexus (action) and Sentinel (evidence); Selection findings flow through Atlas (executive) and Steward (governance). The user still sees only Sentinel.

### 12.4 Contract, Transition & Market-Intelligence Agents

The same contract extends to the three Volume-3 agents introduced in Chapters 9–11. They sit *downstream* of the engine agents and close the lifecycle loop from signature to value.

**Contract Agent (Ch9).**
- *Mission:* verify the signed contract against the negotiated BAFO outcome and scorecard commitments — catch the "tier-1 SLA claimed in evaluation, best-effort in the contract" contradiction.
- *Inputs:* uploaded contract via `artifact-registry/upload-contract.ts`, the BAFO outcome envelope (d23), the d16 scorecard commitments, and d25 risk attestation.
- *Outputs:* redline/clause-gap findings, SLA/liability verification, each as an envelope with the contradicting evidence cited.
- *Decision rights:* RECOMMEND redlines and FLAG contradictions; route to legal sign-off. No authority to accept terms.
- *Escalation:* any clause-gap touching liability/indemnity escalates to legal with Steward holding the gate.

**Transition Agent (Ch10).**
- *Mission:* score transition readiness quantitatively (KT plan maturity, parallel-run scope, cutover sequencing, rollback depth) and monitor checkpoint slippage.
- *Inputs:* `transition-readiness-view.ts`, KT evidence (d31), checkpoint log (d30).
- *Outputs:* readiness score envelope, blackout-window status, slippage alerts.
- *Decision rights:* RECOMMEND go/no-go on cutover; FLAG blackout violations. Cutover authorization is human.
- *Escalation:* a slipped checkpoint or a readiness score below threshold routes an action onto `commercial-mission-queue.ts` and escalates to the transition owner.

**Market-Intelligence Agent (Ch11).**
- *Mission:* calibrate internal reasoning against market data — vendor profiles, peer benchmarks, pricing/savings intel, AI-capability assessment.
- *Inputs:* `intelligence-patterns.ts`, `pattern-manifest.ts`, upgraded from keyword to semantic retrieval via `src/lib/sentinel/orchestrator.ts`.
- *Outputs:* benchmark envelopes that feed the Negotiation Agent's leverage analysis and the Evaluation Agent's should-cost calibration. (`should-cost-model.ts` is today imported and called by the *dormant* `source-answer-engine.ts` — so it has a call-site there, though the module's own header still carries a stale "NOT wired" comment — but it is not reached by the live `generate-route` pipeline; this agent's should-cost calibration depends on promoting that path to live.)
- *Decision rights:* ADVISE only. It injects market context; it never makes an event-level recommendation.
- *Escalation:* none direct — it raises the confidence (or lowers it) of other agents' envelopes by corroboration.

**Handoff topology.** The downstream agents do not poll; they are triggered by upstream state transitions. Selection's award recommendation, once human-approved, triggers the Contract Agent. Contract sign-off triggers the Transition Agent. The Market-Intelligence Agent is a *cross-cutting* contributor that any agent may query — it has no place in the linear chain. This is the lifecycle loop the OS closes.

### 12.5 Coordination, Handoff & Escalation State Machine

**Why it matters.** This is the single largest architectural gap in the current agent layer. Today handoffs are **strings**: `handoffRecommendation: 'Sentinel to Nexus: ...'` (orchestrator, throughout) and `handoffs: \`${mission.agentName} -> ${mission.handoffTarget}: ${mission.title}\`` (mission report, line 99). The grounding map states it plainly: "No agent-to-agent communication about contradictions, risk amplification, or priority negotiation. Handoff routing is string-based, not state-machine driven." A string handoff cannot be enforced, audited, or replayed. It cannot detect that the Evaluation Agent ranked Vendor A first while the Contract Agent found Vendor A's SLA contradicts its bid. It cannot escalate when two agents' risks *amplify* rather than sum.

**What problem it solves.** A structured coordination layer turns four parallel monologues into a governed conversation with contradiction detection, risk amplification, priority negotiation, and deterministic human-escalation triggers. It is the difference between four agents that each look correct in isolation and one OS that catches the cross-agent contradiction a human reviewer would otherwise miss at 2 a.m. before a board meeting.

**How it works.** Replace the string `handoffTarget` with a typed `AgentHandoff` and a coordination state machine. The `SourceAgentMissionState` enum already carries the right vocabulary — `proposed | active | waiting | blocked | completed | dismissed | escalated | deferred` (mission report, `countByState`, line 263). The state machine consumes these.

```
   ┌──────────┐   evidence ok    ┌──────────┐  engine output  ┌───────────┐
   │ PROPOSED │ ───────────────▶ │  ACTIVE  │ ──────────────▶ │ COMPLETED │
   └────┬─────┘                  └────┬─────┘                 └───────────┘
        │ missing input               │ contradiction OR
        ▼                             │ risk amplification
   ┌──────────┐                       ▼
   │ WAITING  │                 ┌───────────┐   human resolves
   └────┬─────┘                 │ ESCALATED │ ◀──────────────┐
        │ Steward gate fails    └─────┬─────┘                 │
        ▼                             │ blocked by gate        │
   ┌──────────┐  waiver granted       ▼                        │
   │ BLOCKED  │ ────────────────▶ ┌──────────┐                 │
   └──────────┘                   │ DEFERRED │ ────────────────┘
                                  └──────────┘
```

Three new coordination behaviors sit on top of this machine:

1. **Contradiction detection.** Before Sentinel composes the primary voice, the coordinator compares engine envelopes for claim conflicts (Evaluation ranks A first; Contract flags A's SLA as best-effort). A detected contradiction forces the involved missions to `ESCALATED` and bars Sentinel from presenting a clean recommendation. This extends `composePrimaryVoice()` — instead of flattening all `cannotProceedReasons` into a set (line 282), the coordinator first reconciles or escalates conflicts.

2. **Risk amplification.** Risks are not merely concatenated (today: `risks: ranked.flatMap((c) => c.contribution.risks).slice(0, 5)`, line 275). The coordinator detects when two agents' risks compound — e.g., Negotiation's "single viable alternate" plus Transition's "aggressive cutover" together exceed either alone — and elevates the combined risk band, escalating if it crosses threshold.

3. **Priority negotiation.** When two missions of equal priority demand conflicting next actions, the `SPECIALIST_PRIORITY` tier order (Steward > Sentinel > Nexus > Atlas) is the tie-break, and the loser's action is recorded as a deferred mission rather than dropped — preserving the audit trail.

**Human-escalation triggers (deterministic, not discretionary).** The OS must escalate, not improvise, on: (a) a Steward gate block with no waiver; (b) a Sentinel refusal on insufficient evidence; (c) any award, walk-away, or cutover recommendation below its confidence band; (d) a detected cross-agent contradiction; (e) an amplified risk crossing threshold; (f) value labeled by Atlas as anything other than measured `realized`. Each escalation persists with the envelope attached — closing the auditability gap the grounding map flags ("multi-agent briefing is transient; not persisted").

**Implementation implication.** This wires into `src/lib/source/agent-mission-report.ts` (the handoff/state machinery) and `commercial-mission-queue.ts` (action routing). The string `handoffRecommendation`/`handoffTarget` fields remain for back-compat display but are *derived from* the typed state machine, not the source of truth.

### 12.6 Specialist Registry & Plugin Architecture

**Why it matters.** Today the seven specialists are **hardcoded inside the orchestrator** as the `specialistContributions` array (orchestrator, line 295). Adding an eighth specialist — say a should-cost challenger or a renewal-window detector — means editing `buildSentinelSourceBriefing()`. The seven existing builders (`buildContextValidationChecker`, `buildEvidenceGapDetector`, `buildExecutiveDecisionBriefWriter`, `buildMinimumDataRequestGenerator`, `buildNextActionRecommender`, `buildValueAtStakeSummarizer`, `buildWorkflowBlockerDetector`) are real runtime code — they execute on every briefing — but they are **deterministic prose assembly with no engine behind them** (transient, not persisted). The only artifacts under `src/lib/source/__tests__/specialists/` are `*.test.ts` files plus a `specialist-test-utils.ts` helper; there are no separate runtime specialist *modules* there. So the grounding map's maturity-1 read is more precise stated this way: the runtime builders exist, run, and emit deterministic prose, but the model-backed engine reasoning each is meant to carry is unbuilt and exercised only in those tests. The architecture has a real frame and dormant model-backed logic.

**What problem it solves.** A registry decouples *what specialists exist* from *how the orchestrator runs them*, and gives the deterministic-prose builders an engine-backed runtime home. New reasoning capability becomes a registered plugin, not an orchestrator edit. This is what lets Source grow from 7 specialists toward the 10+ the dossier prescribes without re-opening the front agent.

**How it works.** Define a `SourceSpecialist` interface — `{ id, flavor: SourceAgentName, missionType, run(input): SpecialistContribution }` — and a `SpecialistRegistry` that the orchestrator iterates instead of the hardcoded array. The seven existing builders register first as the seed set; their bodies are swapped from deterministic prose to calls into the live engines (Evaluation/BAFO/Selection), promoting the engine-backed reasoning currently exercised only in `__tests__/specialists/` into the runtime path.

```
   buildSentinelSourceBriefing()
            │
            ▼
   ┌──────────────────────┐     register()    ┌────────────────────────────┐
   │  SpecialistRegistry  │ ◀──────────────── │ evidence-gap-detector       │
   │  (iterates, no edit  │ ◀──────────────── │ next-action-recommender     │
   │   to orchestrator)   │ ◀──────────────── │ value-at-stake-summarizer   │
   └──────────┬───────────┘ ◀──────────────── │ executive-decision-writer   │
              │ rank + run                      │ minimum-data-request-gen    │
              ▼                                 │ workflow-blocker-detector   │
   SpecialistContribution[]                     │ context-validation-checker  │
              │                                 │ + future plugins…           │
              ▼                                 └────────────────────────────┘
   composePrimaryVoice() → SENTINEL
```

The registry preserves the existing ranking semantics (`rankSpecialists()` by tier then confidence, orchestrator line 29) — it changes *registration*, not *synthesis*. The Sentinel voice-doctrine check (`checkSentinelVoice`) still runs over the composed output, so the trust contract is unchanged.

**Business value (illustrative range).** The registry is the leverage point that turns the agent layer from a fixed feature into an extensible platform — the Phase 7 "full Source intelligence platform" capability. It is also the line between defensible IP (a governed, extensible reasoning fabric) and a commodity chatbot. Expected effect: specialist time-to-add drops from an orchestrator change with regression risk to a registered module behind a stable interface.

**Implementation implication.** The seam is precisely `buildSentinelSourceBriefing()` in `sentinel-source-orchestrator.ts` and the test fixtures in `__tests__/specialists/`. This is a refactor-and-wire, not a greenfield — consistent with the program's "locate every change at a named file, not a new build" discipline.

### 12.7 Chapter Synthesis

The agent architecture is the OS's face and its conscience. One front agent (Sentinel) speaks; three posture voices (Steward blocks, Sentinel refuses, Atlas frames) hold the trust line; three engine agents (Evaluation, Negotiation, Selection) and three lifecycle agents (Contract, Transition, Market-Intelligence) reason and hand off through a typed state machine that detects contradiction, amplifies compounding risk, and escalates to humans on deterministic triggers. A specialist registry makes the whole thing extensible without re-opening the front agent. Every element of this is a promotion of code that already exists — the orchestrator, the mission report, the voice doctrine, the type contracts — from a deterministic, fixture-bound, transient frame into a live, engine-backed, persisted, decision-empowered architecture. The single most important change is the smallest to state and the largest to build: replace string handoffs with the coordination state machine, because that is what turns four clever monologues into one trustworthy operating system.

---

---

## Chapter 13 — Data Architecture

> Volume 3 · Enterprise Architecture · Classification: board-grade, confidential
>
> *The reasoning is only as defensible as the data model underneath it. This chapter specifies the persistence architecture that lets Source move from "a system that stores documents" to "a system that stores why."*

### 13.0 The Thesis at the Data Layer

Every preceding chapter argued the same point from a different altitude: Source must become a sourcing intelligence operating system, where documents are the *output* of reasoning rather than the *unit* of work. That thesis has a quiet but absolute corollary at the data layer. **A reasoning OS cannot be built on a persistence model that stores only outcomes.** You cannot audit a recommendation you did not record the reasoning for. You cannot show a CXO why vendor A outranked vendor B if the only artifacts on disk are the final memo body and a status enum. You cannot calibrate confidence over time if confidence was never persisted as a structured value. And you cannot enforce a gate against evidence that was never bootstrapped into a row.

Today's Source data model — three per-event state tables plus an events table — is a faithful and well-built representation of *where each artifact and gate stands*. It is a state ledger. What it is not, and what this chapter specifies, is a **reasoning ledger**: a persistence layer that captures the analysis, the evidence that shaped it, the assumptions tested and rejected, the confidence band, and the lineage from a board decision back to the L2/L3 ticket extract that justified it. That gap is why Chapter 13 is load-bearing: it is the schema that makes Volume 2's engines auditable and Volume 4's live-proof requirement satisfiable.

The chapter proceeds in five sections: (13.1) the current persistence model and its precise limits; (13.2) the new reasoning-layer entities; (13.3) the three-layer separation of context, knowledge, and reasoning data; (13.4) the graph relationships and evidence lineage; and (13.5) data-layer enforcement of the evidence readiness ramp.

---

### 13.1 Current Persistence and Its Limits

#### What exists today

The live Source data substrate is four tables. The events table (`supabase/migrations/20260430150000_source_events.sql`) anchors each sourcing event with `client_key`, `event_code`, `current_stage_key` (defaulting to `intake`), `lifecycle_state`, `estimated_value_usd`, and `linked_program_id`. On top of it sit the three per-event state tables created in `supabase/migrations/20260507230000_source_canvas_per_event_substrate.sql`, mirrored in TypeScript at `src/lib/source/canvas-substrate/types.ts`:

```
                        ┌─────────────────────────────────────┐
                        │           source_events             │
                        │  id · client_key · event_code       │
                        │  current_stage_key · lifecycle_state │
                        │  estimated_value_usd · linked_program│
                        └──────────────────┬──────────────────┘
                                           │ 1:N (source_event_id FK, ON DELETE CASCADE)
            ┌──────────────────────────────┼──────────────────────────────┐
            ▼                              ▼                               ▼
┌───────────────────────┐  ┌──────────────────────────────┐  ┌───────────────────────────┐
│ source_event_artifact │  │ source_event_gate_criterion  │  │ source_event_evidence     │
│        _states        │  │           _states            │  │        _states            │
│ artifact_code (d01..) │  │ criterion_id (GATE-…)        │  │ requirement_id            │
│ status (6-enum)       │  │ state (5-enum)               │  │ current_state (7 labels)  │
│ tier · body(markdown) │  │ from_stage→to_stage          │  │ source_artifact_id        │
│ body_generation_meta  │  │ evidence_artifact_ids[]      │  │ stage_key · last_synced   │
│ (JSONB)               │  │ waiver_approval_id           │  │                           │
└───────────────────────┘  └──────────────────────────────┘  └───────────────────────────┘
```

These tables are seeded at event creation by the pure scaffold builder in `src/lib/source/canvas-substrate/scaffold.ts`, which fans the canonical catalogs (`SOURCE_ARTIFACT_SPECS`, `SOURCE_GATE_CRITERIA`, `SOURCE_EVIDENCE_REQUIREMENTS`) into one state row per spec. A fifth table, `source_event_pricing_submissions` (`supabase/migrations/20260508040000_…`), stores parsed vendor xlsx submissions with `unit_prices_by_id` (JSONB), `assumption_deviations`, and a `parse_status` CHECK — the one place in the system where real vendor data lands in structured form. All five tables are tenant-scoped via a denormalized `tenant_key`/`client_key` column and RLS through `can_read_tenant_by_key()`, a deliberate denormalization that trades storage for avoiding a join on every row-level security check.

This is a **maturity-4 state ledger**. The enum discipline is excellent: artifact `status` is a clean six-value lifecycle (`not_started → drafting → needs_review → approved → locked → superseded`), gate `state` is a five-value verdict (`pending | met | not_met | waived | deferred`), and the evidence `current_state` carries all seven readiness labels. The transformer functions (`artifactStateRowToView` et al.) cleanly separate DB rows from camelCase view-models, honoring the project's types.ui/types.db discipline.

#### Where it falls short — five structural limits

The model is strong at *state* and silent at *reasoning*. Five limits gate everything in Volumes 2–3:

| # | Limit | Evidence in the schema | Downstream consequence |
|---|---|---|---|
| L1 | **Evidence rows are never bootstrapped with real state.** Scaffold seeds `current_state` at the catalog default (effectively `Not Requested`); no ingestion path advances them. | `scaffold.ts` `NewEvidenceStateRow` has no state-machine; the grounding map confirms "Evidence state is never bootstrapped at event creation." | Gates cannot read real evidence state, so they default to advisory. The governance backbone has nothing to govern against. |
| L2 | **No reasoning is persisted — only the artifact body.** The analysis behind a memo lives nowhere; `body_generation_metadata` captures model/tokens/stop-reason, not claims/evidence/assumptions. | `SourceEventArtifactStateRow.body_generation_metadata: Record<string, unknown>` — an unindexed JSON bag. | The Reasoning Envelope (Vol 2, Ch 5) has no home table. Recommendations are unauditable; confidence is unrecorded. |
| L3 | **No state machine — only current state.** Each table stores the *present* value; transitions are overwrites, not events. | No `*_transitions` or audit table exists alongside the five state tables. | No waiver trail, no "who advanced this gate and on what evidence," no time-series for confidence calibration. Fails the release-control audit-evidence standard. |
| L4 | **The value ledger and pricing payloads are JSONB, not indexed entities.** Vendor unit prices live in `unit_prices_by_id` JSONB; normalized comparison is computed transiently. | `source_event_pricing_submissions.unit_prices_by_id JSONB` — fine for storage, useless for cross-vendor, cross-event analytics. | The BAFO and Selection engines (Vol 2) cannot query "every vendor's transition rate across all AMS events" — the market brain (Ch 11) has no queryable substrate. |
| L5 | **No vendor or market entity exists at all.** Vendors appear only as a `vendor_name` string on a pricing submission. | No `vendor_profiles`, no `benchmarks` table anywhere in `supabase/migrations/`. | Evaluation, leverage analysis, and benchmark-calibrated should-cost (Ch 11) have no entity to attach to or learn across events. |

The honest framing for the board: **the current model is the correct foundation, not a mistake to undo.** Every new entity in 13.2 extends these tables through foreign keys; nothing is rebuilt. The work is additive — which is exactly what the release-control discipline rewards and what makes the roadmap's phased proof points achievable.

---

### 13.2 New Entities for the Reasoning Layer

The reasoning layer introduces eight new entities. They divide into three clusters: **reasoning capture** (the envelope and its trace), **commercial records** (proposals, scorecards, negotiation rounds, waivers), and **market knowledge** (vendor profiles, benchmarks). Each is specified below with its columns, tenancy posture, and the relationships that wire it into the existing substrate.

#### Cluster A — Reasoning Capture

**`reasoning_envelopes`** — the keystone. This is the persisted form of the Reasoning Envelope contract defined in Volume 2, Chapter 5. Every reasoning step (an evaluation consensus, a leverage analysis, a selection recommendation) emits exactly one envelope row. Its TypeScript shape extends the structures already sketched in `src/lib/source/agent-mission-report.ts` and `multi-agent-types.ts`.

```
reasoning_envelopes
  id                  UUID PK
  source_event_id     UUID FK → source_events(id) ON DELETE CASCADE
  tenant_key          TEXT          -- denormalized for RLS, mirrors substrate pattern
  produced_by         TEXT          -- engine/agent id: 'evaluation' | 'bafo' | 'selection' | 'sentinel'
  subject_artifact_code TEXT        -- e.g. d16, d24 — the deliverable this reasoning grounds
  stage_key           TEXT          -- S0..S7 (canonical stage-pack scheme)
  claims              JSONB         -- [{ claim, supportingEvidenceIds[], strength }]
  assumptions         JSONB         -- [{ assumption, status: 'tested'|'rejected'|'accepted', basis }]
  options_considered  JSONB         -- [{ option, rationale, rejectedBecause? }]
  confidence_band     TEXT          -- 'high' | 'medium' | 'low' (calibrated, not heuristic)
  confidence_factors  JSONB         -- { evidenceSufficiency, recency, corroboration, modelUncertainty }
  caveats             JSONB         -- stage-rigor-scoped limits
  decision_trace_id   UUID FK → reasoning_traces(id)
  model_metadata      JSONB         -- model, promptVersion, tokens, stopReason
  created_at          TIMESTAMPTZ
```

The single most important design decision here: **`confidence_band` is a persisted, calibrated value, CHECK-constrained to `'high' | 'medium' | 'low'`, with its `confidence_factors` decomposed into a JSONB structure — not a binary `'high'` literal.** Like every enum elsewhere in this architecture (§13.5), the band carries a CHECK constraint so an illegal value cannot land; it is the factors JSONB, not the band column, that stays free-form. This directly retires the P0 anti-pattern recorded in the archetype-framework memory — the hardcoded `'high'` confidence in the dormant `source-answer-engine.ts`. Persisting the four factors (sufficiency, recency, corroboration, model uncertainty) is what makes confidence *calibratable* over time, which is the Confidence Philosophy of Volume 1, Chapter 4 made durable.

**`reasoning_traces`** — the observability spine. Where the envelope is the *conclusion*, the trace is the *work*: which evidence rows were retrieved, what archetype/mode/framework was selected and why, the score at each decision point, and the ordered steps. This is the persisted upgrade of today's transient `body_generation_metadata` (L2) and the evidence-trace seam at `src/lib/source/evidence-trace/`.

```
reasoning_traces
  id · source_event_id FK · tenant_key
  envelope_id        UUID FK → reasoning_envelopes(id)
  retrieved_evidence JSONB   -- evidence ids + retrieval scores
  framework_selected TEXT    -- should-cost | delivery-model-gate | proposal-normalization | …
  archetype_resolved TEXT    -- AMS | ERP-SI | AI-data-platform | renewal (from classifySourcingEvent)
  rigor_resolved     TEXT    -- standard | enhanced | strategic (SourceRigorLevel)
  steps              JSONB   -- ordered [{ step, input, output, scoreDelta }]
  created_at
```

#### Cluster B — Commercial Records

These four tables promote the *fixture-bound, transient* commercial layer (`bafo-negotiation.ts`, `award-decision-view.ts`, etc.) into queryable, audit-bearing records.

| Entity | Replaces / extends | Key columns | Why it must be a table, not JSONB |
|---|---|---|---|
| **`vendor_proposals`** | The `unit_prices_by_id` JSONB in pricing submissions, normalized | `source_event_id`, `vendor_profile_id` FK, `normalized_cells` (8-dimension matrix), `parse_status`, `superseded_by` | The BAFO engine's pricing normalization (Vol 2, Ch 7) needs row-level, cross-vendor queries on each of the eight dimensions (scope, assumptions, rates, accelerators, IP, security, transition, SLAs). |
| **`scorecard_submissions`** | The display-only d16 (`scorecard.ts`) | `source_event_id`, `rater_user_id`, `criterion_id`, `score`, `weight_at_submission`, `evidence_ids[]`, `deviation_flag` | Multi-rater consensus, >5-point deviation flagging, and evidence-anchored scoring (Ch 6) require per-rater, per-criterion rows — not one blob per scorecard. |
| **`negotiation_rounds`** | The seeded levers in `bafo-negotiation-model.ts` | `source_event_id`, `vendor_profile_id`, `round_no`, `asks` JSONB, `concessions` JSONB, `residual_gap`, `walk_away_threshold` | The concession tracker (Ch 7, d23 round log) is inherently a time-series; each round is an immutable event. |
| **`waivers`** | The orphan `waiver_approval_id` on gate states | `source_event_id`, `criterion_id`, `requested_by`, `approved_by`, `rationale`, `expires_at`, `state` | Closes the governance loop (Vol 2, Ch 8). Today `gate_criterion_states.waiver_approval_id` points at nothing — this is the table it points to. |

#### Cluster C — Market Knowledge

**`vendor_profiles`** and **`benchmarks`** are the persistent substrate for the Market Intelligence Layer (Chapter 11). Critically, these are **not per-event** — they are cross-event, tenant-or-shared-scoped knowledge (see §13.3). `vendor_profiles` carries capabilities, references, financials, and an AI-maturity assessment; `benchmarks` carries market pricing, savings ranges, and should-cost calibration points keyed by `archetype × dimension`. Every `vendor_proposal` and `scorecard_submission` FKs into `vendor_profiles`, so the system can finally answer "how did this vendor perform across our last five AMS events" — the learning loop that no per-event-only model can support.

#### Tenancy and RLS posture

Every new table follows the proven substrate pattern: a denormalized `tenant_key`, RLS via `can_read_tenant_by_key()`, and `ON DELETE CASCADE` from `source_events` for the per-event entities (Clusters A and B). The two knowledge entities (Cluster C) take a different posture — addressed next — because cross-event knowledge that cascade-deletes with a single event would be a data-loss bug.

---

### 13.3 Context, Knowledge, and Reasoning Layer Separation

The eight new entities are not a flat pile of tables. They belong to **three distinct data layers**, and the separation is itself an architectural commitment that the app-tier must respect. This is the data-model expression of the broker-boundary doctrine already in force in the codebase.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  CONTEXT LAYER  (per-event, per-tenant, mutable state)                     │
│  source_events · source_event_artifact_states · …_gate_criterion_states    │
│  …_evidence_states · …_pricing_submissions                                 │
│  vendor_proposals · scorecard_submissions · negotiation_rounds · waivers   │
│  → "what is true for THIS event for THIS tenant right now"                 │
└───────────────────────────────┬────────────────────────────────────────────┘
                                 │  read via AgentContextBroker contract
                                 ▼          (agent-context.ts / context-builder.ts)
┌──────────────────────────────────────────────────────────────────────────┐
│  KNOWLEDGE LAYER  (cross-event, market/pattern/benchmark, slow-changing)   │
│  vendor_profiles · benchmarks · pattern-manifest (intelligence-patterns)   │
│  → "what is true across events and across the market"                      │
└───────────────────────────────┬────────────────────────────────────────────┘
                                 │  written ONLY by reasoning engines
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  REASONING LAYER  (immutable, append-only, audit-grade)                    │
│  reasoning_envelopes · reasoning_traces                                    │
│  → "why the system concluded what it concluded, with full lineage"         │
└──────────────────────────────────────────────────────────────────────────┘
```

The rules that make this separation load-bearing:

1. **Direction of writes is one-way.** Engines read Context + Knowledge, and write Reasoning. Reasoning rows are append-only and immutable — a recommendation is never edited, only superseded by a new envelope. This is what gives the audit trail integrity: you can replay every decision the system ever made.

2. **Knowledge is never cascade-deleted with an event.** `vendor_profiles` and `benchmarks` outlive any single sourcing event. Deleting the SkyHarbor AMS event must not erase what the system learned about the incumbent vendor. This is why Cluster C breaks from the `ON DELETE CASCADE` pattern of the per-event substrate.

3. **The app-tier never reaches across layers directly.** Per the established knowledge-layer broker boundary, UI and route code must read through the `AgentContextBroker` contract (`src/lib/source/agent-context.ts`, `context-builder.ts`) rather than importing the knowledge or reasoning stores directly. The data architecture makes this enforceable: the broker is the only module granted read access to the Knowledge layer, and the reasoning engines are the only writers to the Reasoning layer.

**Why this matters in business terms.** Mixing these layers is the single most common way enterprise AI systems become un-auditable and un-improvable. If reasoning is overwritten, you lose the ability to show a board why a decision was made — fatal in a procurement context where awards are legally contestable. If knowledge is trapped per-event, the system never gets smarter — every event starts from zero, and the "intelligence" in "intelligence OS" is a marketing claim rather than a queryable asset. The three-layer model is what lets AbarVa truthfully claim cycle-time and savings improvement (illustrative range: 15–30% cycle-time reduction across repeated category events) because each event genuinely inherits the last one's learning.

---

### 13.4 Graph Relationships and Evidence Lineage

State tables answer "what is the status." A graph answers "what connects to what" — and sourcing defensibility is fundamentally a connectivity question: *can I trace this board decision back to the raw evidence that justifies it, and can I trace forward from a piece of evidence to every gate and claim it unblocks?*

The substrate already has the seeds of this graph. `gate_criterion_states.evidence_artifact_ids[]` links a gate to evidence; `artifact-gate-map.ts` links artifacts to the gates they satisfy; `evidence_states.source_artifact_id` links an evidence requirement to the uploaded artifact that fills it. What is missing is a **first-class, typed edge model** that unifies these into a traversable knowledge graph and adds the reasoning-layer edges.

We specify three edge types, expressed as a single `reasoning_edges` table (typed, directional, tenant-scoped):

| Edge type | From → To | Meaning | Powers |
|---|---|---|---|
| `evidence_for` | evidence_state → claim (in envelope) | This evidence row substantiates this specific claim | Backward trace: "show me the L2/L3 ticket extract behind the should-cost number in the d24 brief" |
| `synthesis` | envelope → envelope | This reasoning was built on that reasoning (e.g., selection envelope synthesizes evaluation + BAFO envelopes) | Cross-engine handoff lineage (Vol 3, Ch 12 coordination state machine) |
| `contradiction` | claim → claim / artifact → artifact | These two facts disagree (e.g., "tier-1 SLA claimed in d16" vs. "best-effort in d28 contract") | The commercial-risk and contract-verification engines (Ch 9) flagging contradictions for human escalation |

The bidirectional trace this enables is the UX promise of the reasoning-trace panel (Ch 14) made queryable:

```
  GATE-DECISION-01  ──met_by──►  d24 decision brief
        │                              │ grounded_by
        │ unblocked_by                 ▼
        ▼                        reasoning_envelope (selection)
  evidence: vendor pricing            │ synthesis
  responses [Usable Evidence]    ┌────┴─────┐
        ▲                        ▼          ▼
        │ evidence_for      envelope    envelope
        │                  (evaluation) (BAFO)
   source_artifact:             │ evidence_for
   vendor_a_pricing.xlsx        ▼
   (parsed → normalized →   scorecard_submissions
   vendor_proposals row)    + vendor_proposals
```

A reviewer clicking the d24 board decision can walk *down* to the exact normalized pricing cells and parsed ticket extracts; an analyst who re-parses a vendor file can walk *up* to see every claim, score, and gate that now needs re-validation. This is provenance as a queryable property of the system, not a PDF appendix — and it is precisely the audit evidence the release-control discipline demands for any `client-data-lane` change.

---

### 13.5 Evidence Readiness Ramp Enforcement at the Data Layer

The seven-state readiness ramp is fully specified in types (`SourceEventEvidenceCurrentState`) and catalogued in `canonical-specs/evidence-requirements.ts` (21 requirements). But per L1 and the grounding map, it is enforced *nowhere*: rows are never bootstrapped to real state, the UI collapses seven states to a binary, and gates do not read minimum-state thresholds. This section closes that gap at the layer where it can actually be guaranteed — the database — rather than in application code that can be bypassed.

**Three enforcement mechanisms:**

1. **CHECK-constrained state with a transition function.** Replace the free-text `current_state` with a CHECK constraint over the seven labels, and route every mutation through a `advance_evidence_state()` SQL function that validates the transition is legal (the ramp is `Not Requested → Loaded → Parsed → Available → Usable Evidence`, with `Stale`/`Low Confidence` as side-states reachable from any active state). Illegal jumps (e.g., `Not Requested → Usable Evidence`) are rejected at the database, satisfying the context-ingestion truth standard's insistence that "loaded," "parsed," and "usable" are *separate states* that must never be collapsed.

2. **An append-only `evidence_state_transitions` audit table.** Every advance writes a row: `from_state`, `to_state`, `actor`, `source_artifact_id`, `at`. This is the data-layer answer to L3 (no state machine) and supplies the lineage the §13.4 graph traverses. It is also the audit evidence a release record cites when claiming an event's evidence is "usable."

3. **Bootstrap real evidence rows at event creation.** Extend `scaffold.ts` so `NewEvidenceStateRow` seeds at `Not Requested` *and* registers the requirement so the ingestion path (Admin loader → parse → commit) can advance it through the real ramp. Critically — and consistent with the governed-ingestion contract — scaffolding seeds the *requirement*, never fabricated evidence; only the loader, after a genuine parse with source citations, may advance a row to `Parsed` or beyond.

With these three in place, gates can finally read **real** evidence state. `source-governance-enforcement.ts`'s `evaluateCriterionMetReadiness()` already reads the `EVIDENCE_RANK` map; once the underlying rows carry truthful, constraint-guaranteed state, the same function flips from advisory to enforcing without a rewrite. The governed-refusal posture (the net-new evidence-or-refuse mechanism that wires into `source-answer-engine.ts`, per Volume 1) gains a trustworthy substrate: it can refuse to advance a gate or surface a recommendation *because the database guarantees the evidence has not reached `Usable Evidence`*, not because application code happened to check.

**The business payoff** is the difference between a system that *claims* governance and one that *has* it. A gate that cannot be advanced past a CHECK constraint is a control an auditor, a CIO advisory board, or a contesting losing bidder can rely on. That reliability — evidence states that mean what they say, decisions that trace to their grounds, knowledge that compounds across events — is the data architecture that turns the intelligence-OS thesis from an aspiration into an enforceable property of the platform.

---

### 13.6 Migration Path and Layer Mapping

To keep this implementable under release-control discipline, the new entities map cleanly to roadmap phases (Vol 4, Ch 16) and to release lanes:

| Entity / mechanism | Roadmap phase | Release lane | Live-proof gate |
|---|---|---|---|
| `reasoning_envelopes` + `reasoning_traces` | Phase 1 (reasoning spine) | `global-control-lane` (flag-gated) | One real event emits a persisted, queryable envelope on ACA private DB |
| `scorecard_submissions`; ramp CHECK + transitions + bootstrap | Phase 2 | `client-data-lane` | Real multi-rater scoring + evidence advanced through ramp by loader |
| `vendor_proposals`; `negotiation_rounds` | Phase 3 | `client-data-lane` | Live vendor xlsx normalized into row-level cells (not JSONB) |
| `waivers`; `reasoning_edges` (contradiction) | Phase 4 | `global-control-lane` | Waiver request → approval → gate-variance recorded with audit trail |
| `vendor_profiles`; `benchmarks` | Phase 7 (market brain) | `client-data-lane` + shared knowledge | Cross-event vendor query returns calibrated benchmark |

Every one of these is **additive** — new tables and constraints alongside the proven five-table substrate, reachable only through the broker boundary, written one-way into an append-only reasoning layer. No existing migration is reversed; the current state ledger becomes the Context layer of a three-layer model. That additive, lane-classified, live-proof-gated path is what makes a data architecture of this ambition shippable rather than a rewrite the organization cannot afford.

---

---

## Chapter 14 — UX Architecture

A sourcing intelligence operating system is judged at the glass. The reasoning engines specified in Volume 2 and the contract, transition, and market layers of Volume 3 only become *value* when a category manager, an evaluation lead, a commercial negotiator, and a CIO can each look at a screen and act with conviction. This chapter specifies the UX architecture for that act of conviction. It is not a component library and not a visual style guide — the design tokens are already locked (`#F8F7F4` canvas, Georgia serif headings at normal weight, DM Sans body, black/ghost buttons; see `src/components/source/foundationStyles.ts`, which exposes `COLORS`/`FONTS` and is the single token source every Source surface already imports). This chapter is the *interaction architecture* that turns reasoning into decisions: the principles that govern every screen, the six decision surfaces that map one-to-one onto the engines of Volumes 2–3, and the cross-cutting reasoning-trace panel that is the literal UX expression of the OS thesis.

The governing design fact, established in Volume 1's current-state audit, is that Source today renders *outputs* (stage canvases, artifact drawers, gate panels, commercial views) but rarely renders *reasoning*. There are 80-plus components under `src/components/source/`, and the commercial cluster alone runs to two dozen panels (`SourceCommercialHub.tsx`, `AmsBafoPanel.tsx`, `PricingNormalizationMatrix.tsx`, `ScorecardGovernancePanel.tsx`, and others) — but these are fixture-bound display surfaces. The UX work of this volume is not to add screens. It is to re-found the existing surfaces on a reasoning substrate so that every recommendation carries its *why*.

### 14.1 UX Principles for a Reasoning System

Five principles govern every Source surface. They are not aesthetic preferences; each one solves a specific failure mode that the audit and the founder's repeated density rejections (recorded in the canvas-density contract) have already surfaced.

**Principle 1 — Surface the reasoning trace, not just the answer.** *Why it matters:* a recommendation a CIO cannot interrogate is a recommendation a CIO will not sign. *Problem it solves:* today's generated deliverables (d01/d05/d09, the only three live in `prompt-registry.ts`) emit prose with no visible evidence weighting, no confidence band, and no assumption ledger; the reader must trust or reject the whole artifact. *How it works:* every recommendation-bearing surface renders a **reasoning trace** — the ranked evidence that drove the conclusion, the assumptions held, the confidence band, and the decision path — sourced from the reasoning envelope defined in Volume 2 and carried on the mission-report contract (`src/lib/source/agent-mission-report.ts`, `SourceAgentMissionReport`, with its `contextUsedSummary`). *Business value:* decision latency at the board gate collapses because the dissent-worthy assumptions are already on the table (illustrative range: 30–50% faster executive sign-off). *Implementation:* a single reusable panel (§14.8) bound to the envelope, not re-authored per screen.

**Principle 2 — Density discipline: one row per item, status as color, forms reveal on click.** *Why it matters:* the founder rejected canvas clutter twice (preview pane, then a triple-repeating gate panel with always-open textareas); the lesson, recorded as the canvas-density contract, is *"every click is a decision, not form-fill."* *Problem it solves:* sourcing surfaces carry high cardinality — dozens of criteria, vendors, clauses, checkpoints — and naive layouts drown the operator. *How it works:* each list surface renders exactly one row per item; **status is encoded as color** (drawing the locked palette's teal/amber/risk tokens), there is one gap line of breathing room, and any form to edit an item *reveals on click* with detail living one level down in a drawer (`SourceDrawerShell.tsx`, `SourceArtifactDrawer.tsx`, `EvidenceTraceDrawer.tsx` are the existing drawer primitives). *Business value:* an evaluation lead scans 40 criteria in seconds rather than scrolling a wall of open textareas. *Implementation:* the row-per-item pattern is already partially present in `SourcingEventTable.tsx` and `VendorScorecardMatrix.tsx`; this chapter makes it the universal contract.

**Principle 3 — The Ask-Anything agent toolbar is the agentic spine.** *Why it matters:* without a persistent, GPT-style bottom toolbar the surface does not *feel* agentic (recorded as a standing feedback item). *Problem it solves:* operators have questions that no static panel anticipates ("which vendor has the weakest SLA evidence?"). *How it works:* a sticky, auto-growing, spellchecked, Enter-submits toolbar fronts **Sentinel** (the one front agent for Source; Nexus=Moves, Atlas=Tower, Steward=governance voice) on every surface, routing to the grounded-answer engine (`source-answer-engine.ts`, today DORMANT) once it is wired. Existing scaffolds — `PersistentNexusPanel.tsx`, `SentinelMissionPanel.tsx`, `SentinelEngagementCanvas.tsx` — are the seams. *Business value:* the surface answers the question the screen didn't anticipate, which is where consulting value actually lives. *Implementation:* one toolbar component, rendered by the `(maestro)/source/layout.tsx` shell so it is universal.

**Principle 4 — Format follows intent.** Rich, conversational reasoning renders inline (markdown → tables/lists); heavy or structured output renders as a downloadable artifact card (Claude-artifact / GPT-canvas style), reusing the HTML/DOCX/PPTX/XLSX renderers in `src/lib/source/exports/`. *Value:* the operator never restructures a wall of text into a board deck by hand.

**Principle 5 — Anchor in the locked design system and the existing component set.** No new color, font, or layout primitive is introduced. Every surface specified below composes existing tokens and drawer/panel primitives. *Value:* the redesign is additive, not a rewrite, which is what keeps it shippable.

```
   ┌──────────────────────── SOURCE SURFACE SHELL ─────────────────────────┐
   │  SourceSubNav (sticky)  ·  Stage rail S0──S7                           │
   │  ┌─────────────────────────┐   ┌──────────────────────────────────┐   │
   │  │  DENSITY-DISCIPLINED     │   │  REASONING TRACE PANEL           │   │
   │  │  CANVAS                  │──▶│  evidence weights · assumptions  │   │
   │  │  one row / item          │   │  confidence band · decision path │   │
   │  │  status = color          │   │  (binds reasoning envelope)      │   │
   │  │  forms reveal on click   │   └──────────────────────────────────┘   │
   │  └─────────────────────────┘   detail one level down → SourceDrawer    │
   │  ┌───────────────────────────────────────────────────────────────┐    │
   │  │  ◇ Ask Sentinel anything…                          [↵ submit]   │    │
   │  └───────────────────────────────────────────────────────────────┘    │
   └────────────────────────────────────────────────────────────────────────┘
```

### 14.2 The Evaluation Workbench

**Mandate.** The Evaluation Workbench is the glass for the Evaluation Engine (Volume 2 / Phase 2). It is the surface where multi-rater scores become a defensible, evidence-anchored, weight-governed recommendation. Today the substrate is the weakest in the chain — `scorecard.ts` offers only approval-state helpers, the d16 template is a stub, and the live panel `ScorecardGovernancePanel.tsx` records verdicts rather than producing them. The Workbench is therefore the highest-value UX in the volume.

**Screens & workflow.** The Workbench is a single surface with five tabs, each one row-per-item:

| Tab | One row per | Status color encodes | Forms-on-click reveal | Engine output |
|---|---|---|---|---|
| Rater Submission | criterion × vendor cell | submitted / draft / overdue | score + rationale + evidence link | per-rater raw scores |
| Weight Governance | evaluation criterion | locked / pending-approval / changed | weight value + change reason + approver | governed weight set (d17 weight log) |
| Deviation Review | criterion where raters diverge | within-band / flagged / escalated | side-by-side rater rationales | consensus + dissent (d16) |
| Sensitivity What-If | weight slider | base case / scenario | re-rank result preview | rank stability under weight perturbation |
| Evidence Drill-Down | scored claim | usable / stale / low-confidence | source citation + readiness state | evidence-anchored score |

**User journey.** An evaluation lead opens the Workbench at stage `S4` (post-demo/PoC). She scans the Rater Submission grid — color tells her instantly which raters are overdue. She opens Deviation Review; three criteria are amber (raters diverge beyond band). She clicks a row; the two rationales reveal side-by-side, and the reasoning-trace panel shows that one rater weighted a reference call the other never saw. She resolves it, then runs a Sensitivity What-If: dragging the "AI capability" weight from 15% to 25% does not change the rank order — the recommendation is *robust*, and that robustness is now a board-defensible statement, not a hope. Every score she sees carries a confidence band sourced from the evidence readiness state on the 7-step ramp; a score built on `Loaded`-but-not-`Usable` evidence is visibly low-confidence.

**Grounding & seam.** `ScorecardGovernancePanel.tsx` and `VendorScorecardMatrix.tsx` are the existing surfaces; `EvaluationCriteriaEditor.tsx` becomes the Weight Governance tab; `EvidenceTraceDrawer.tsx` is the drill-down. The Workbench consumes the weighted-aggregation, deviation, and sensitivity outputs the Evaluation Engine must add to `scorecard.ts`.

### 14.3 The BAFO Command Center

**Mandate.** The BAFO Command Center is the glass for the BAFO/negotiation engine (Volume 2 / Phase 3). It turns evaluation outputs and normalized pricing into *leverage* and a per-vendor negotiation strategy. Today's commercial layer is PARTIAL and fixture-bound: `bafo-negotiation.ts`, `ams-bafo-view.ts`, `pricing-normalization.ts`, and the panels `AmsBafoPanel.tsx` / `SourceBafoNegotiationPanel.tsx` / `PricingNormalizationMatrix.tsx` / `PricingTrapLog.tsx` exist over vendor-a/b/c fixtures with no live data call-site.

**Screens & workflow.** Five coordinated zones, density-disciplined throughout:

```
  ┌──── BAFO COMMAND CENTER (stage S5_bafo) ──────────────────────────────┐
  │  LEVERAGE DASHBOARD          │  PER-VENDOR STRATEGY (one row/vendor)    │
  │  switching cost · #bidders   │  ┌ Vendor A  ● strong leverage          │
  │  scope concentration         │  │   target: 12% price ↓ (illustrative) │
  │  → leverage score per vendor │  │   ask: SLA tier-1, cap escalators    │
  │                              │  └ click → strategy detail drawer        │
  ├──────────────────────────────┼──────────────────────────────────────────┤
  │  CONCESSION TRACKER          │  EV SCENARIO MODELING                     │
  │  one row / concession asked  │  walk-away vs. settle expected value      │
  │  status: open/won/conceded   │  per round, with probability bands        │
  ├──────────────────────────────┴──────────────────────────────────────────┤
  │  PRICING-TRAP LOG  one row / detected trap (ramp clauses, unit drift)     │
  └────────────────────────────────────────────────────────────────────────┘
```

**User journey.** A commercial lead enters at `S5`. The Leverage Dashboard shows Vendor A at high leverage (three bidders remain, low switching cost) and Vendor C at low leverage (incumbent, deep integration). She opens Vendor A's per-vendor strategy row; the drawer reveals the recommended concession asks with the reasoning trace explaining *why* each is winnable — the trace cites the should-cost estimate (`should-cost/should-cost-model.ts`) and the normalized price gap. She logs the concessions in the Concession Tracker; the EV Scenario panel updates the expected value of pressing versus settling for each round. (Note on should-cost wiring: `should-cost-model.ts` *is* imported and called by `source-answer-engine.ts`, so it has a call-site there — but that engine is DORMANT, and the module's own header still carries a stale "not wired" comment. Either way, the live `generate-route` pipeline does not yet reach it.) The Pricing-Trap Log flags a back-loaded ramp clause in Vendor B's submission that the normalization layer caught — a trap that would have cost real money post-signature (illustrative range: 3–8% of total contract value). Every number on the screen is a row, color-coded by status; nothing is an open textarea.

**Grounding & seam.** `commercial-mission-adapter.ts` and `commercial-risk-detection.ts` feed the trap log; `bafo-negotiation-model.ts` and `bafo-scenario-compare-view.ts` feed the EV panel; `SourceBafoNegotiationModelPanel.tsx` is the existing model surface. The Command Center is what makes these fixtures live by binding them to real pricing submissions.

### 14.4 The Selection Center

**Mandate.** The Selection Center is the glass for the award recommendation (Volume 2 selection engine). It converts evaluation and BAFO outputs into a ranked recommendation with explicit confidence, decision options, and risk attestation — feeding d24 decision brief, d25 risk attestation, d27 selection memo. Today `award-decision-view.ts`, `vendor-selection-readiness.ts`, and `executive-decision-summary.ts` exist as fixture-bound logic with surfaces `SourceVendorSelectionReadinessPanel.tsx` and `SourceExecutiveDecisionSummaryPanel.tsx`.

**Screens & workflow.** A single decision surface:

| Zone | Contents | Density rule |
|---|---|---|
| Ranked Recommendation | recommended vendor, runner-up, gap, **confidence band** | one row per ranked vendor |
| Decision Options | award / re-BAFO / split / cancel — each with EV and risk | one row per option, color = recommended/viable/discouraged |
| Risk Attestation | residual risks the decider must accept | one row per risk, status = accepted/open |
| Readiness Check | are all gates green to award? | one row per gate (from `gate-criteria.ts`) |
| Sign-off Capture | decider identity, timestamp, rationale, dissent | reveal-on-click form |

**User journey.** A selection lead reviews the ranked recommendation; the confidence band is *medium*, and the reasoning trace explains why — one usable-evidence gap on Vendor A's security posture. She sees a red Readiness Check row: a hard gate (`GATE-` id, severity hard) is unmet. She cannot proceed to sign-off until it clears — the UX enforces the gate the engine defines. Once green, she captures sign-off; her rationale and any dissent are recorded as audit evidence (no demo thinking — this is pilot-grade audit trail).

### 14.5 The Contract Center

**Mandate.** Specified fully in Chapter 9, the Contract Center is the glass for contract intelligence — it picks up after award and renders redline analysis, liability/indemnity assessment, SLA verification, and commercial-term extraction against the negotiated BAFO outcome, anchored on d28 contract record. The renderer exists (`exports/renderers/ai-clause-gap.ts`); the reasoning does not. The clause-extraction substrate is a genuine net-new build: Source's synchronous first-mile parser (`artifact-registry/text-parser.ts`) handles only text-like uploads (pasted notes, Markdown, text, CSV) and does *not* read binary formats. Rich binary vendor-document parsing (DOCX, PDF) is therefore a net-new capability for Source — it must either be built here or reuse the Moves-side async pipeline (`src/lib/programs/` doc-parser and `attachments/extract-text`), with the upload seam at `artifact-registry/upload-contract.ts`.

**Screens & workflow.**

```
  ┌──── CONTRACT CENTER (stage S6_contract) ───────────────────────────────┐
  │  CLAUSE LEDGER  one row / clause                                        │
  │   ● standard   ● redlined   ● gap-vs-BAFO   ● missing                    │
  │   click → clause drawer: uploaded text │ standard position │ trace       │
  │                                                                          │
  │  CONTRADICTION FEED  one row / detected contradiction                    │
  │   "tier-1 SLA scored in evaluation; contract says best-effort"           │
  │   → links to scorecard commitment + BAFO concession + risk attestation   │
  └────────────────────────────────────────────────────────────────────────┘
```

**User journey.** A legal reviewer uploads the vendor's draft MSA via the artifact registry (`artifact-registry/upload-contract.ts`). The Clause Ledger renders one row per extracted clause, color-coded; three rows are red — gaps versus the negotiated BAFO position. The Contradiction Feed surfaces the load-bearing catch: the contract's SLA language is *best-effort*, but the evaluation scored a *tier-1* SLA and the BAFO won a tier-1 concession. `SourceContradictionCard.tsx` is the existing surface for this; the reasoning trace shows the three linked sources (scorecard commitment, BAFO round log, contract clause). The reviewer routes the finding to legal sign-off. This is the surface that prevents the single most expensive sourcing failure mode — winning a commitment in negotiation and losing it in the paper.

### 14.6 The Transition Center

**Mandate.** Specified fully in Chapter 10, the Transition Center is the glass for transition intelligence — readiness scoring, KT tracking, checkpoint logging, and risk monitoring through cutover. It replaces today's binary keyword-derived risk with a quantitative readiness model (d29 transition plan, d30 checkpoint log, d31 KT evidence). Existing logic: `transition-readiness-view.ts`; existing surface seam: the commercial-readiness panels.

**Stage scope (stated once for the volume).** Transition readiness is not a single-stage concern. The work it scores — KT, parallel-run, cutover sequencing, rollback — straddles `S6_contract` (where the transition plan d29 is committed alongside the contract record) into `S7_activate` (where cutover, checkpoint logging d30, and KT evidence d31 are executed and verified). The canonical convention this volume adopts: the *transition plan* is authored and gated at `S6_contract`, and *transition readiness* is scored and the Transition Center is anchored at `S7_activate`, where execution and verification happen. Other chapters that name a single stage for transition deliverables should be read against this convention — `S6` for plan authorship, `S7` for readiness scoring and cutover execution. (The canonical stage scheme is the stage-pack convention `S0_intake..S7_activate`; the UI `source-shape-resolver.ts` uses a divergent S1/S3/S6/S7 labeling — references here use the canonical scheme.)

**Screens & workflow.**

| Zone | One row per | Status color | Engine output |
|---|---|---|---|
| Readiness Scorecard | readiness dimension (KT maturity, parallel-run scope, cutover sequencing, rollback depth) | green/amber/red score | composite readiness score |
| KT Tracker | knowledge item | transferred / verified / gap | d31 KT evidence |
| Checkpoint Log | cutover checkpoint | on-track / slipped / blocked | d30 checkpoint log |
| Risk & Blackout Monitor | active risk / blackout window | monitored / breached | escalation → commercial-mission-queue |

**User journey.** A transition manager opens the Readiness Scorecard at `S7_activate`. Rollback Depth is amber — the plan has no tested rollback for the payments cutover. The KT Tracker shows two knowledge items as *gap* (transferred but not verified). A Checkpoint Log row slips; the Risk Monitor escalates it, routing an action through `commercial-mission-queue.ts`. The manager cannot mark the transition complete while a verified-KT gap remains, closing the lifecycle loop into value realization (d32 value ledger, surfaced by `SourceValueLedger.tsx`).

### 14.7 The Executive Cockpit

**Mandate.** The Cockpit is the portfolio-level board surface — it aggregates across all live sourcing events what the six per-event surfaces show locally. It is the CIO's single pane: which events are at which stage, which are blocked, where the dollars and risks concentrate, and which decisions await sign-off. It composes `SourceEventsPortfolio.tsx` / `SourcePortfolioPage.tsx` (existing portfolio surfaces) with the reasoning layer.

**Screens & workflow.** One row per sourcing event; columns encode stage (S0–S7), value-at-stake (illustrative ranges only, never false precision), readiness, blocking gate count, and pending decision. Color is the language: a red event is gate-blocked; an amber event awaits a decision; teal is on-track. A portfolio reasoning trace explains *concentration* — "62% of value-at-stake sits in three AMS events all entering BAFO this quarter" (illustrative range) — which is exactly the cross-event insight a CIO advisory board wants and no per-event screen can show.

**User journey.** The CIO opens the Cockpit weekly. Two events are red (gate-blocked); one amber awaits award sign-off. She clicks the amber row; it deep-links into that event's Selection Center. She asks Sentinel via the Ask-Anything toolbar: "which events are most exposed to a single vendor?" — and the grounded answer (once `source-answer-engine.ts` is wired) returns a portfolio concentration view with citations. The Cockpit is where the OS thesis becomes visible to the buyer of the OS.

### 14.8 Reasoning Trace Visualization (Cross-Surface)

This is the keystone of the chapter and the literal UX expression of the OS thesis: *documents are outputs of reasoning, so reasoning must be visible everywhere*. A **single reusable reasoning-trace panel** renders on every surface above. It binds to the reasoning envelope (Volume 2) carried on the multi-agent contracts — `SourceAgentBriefing` and `SpecialistContribution` in `multi-agent-types.ts`, and `SourceAgentMissionReport.contextUsedSummary` in `agent-mission-report.ts`, where confidence is already typed as `'low' | 'medium' | 'high'`.

The panel renders four bands, each density-disciplined:

```
  ┌──── REASONING TRACE ───────────────────────────────────────────┐
  │  CONFIDENCE   ● medium   (1 usable-evidence gap)                 │
  │  EVIDENCE     one row / item, ranked by weight                   │
  │   ▸ ref-call transcript      weight 0.31  ● usable               │
  │   ▸ pricing submission        weight 0.27  ● usable               │
  │   ▸ security questionnaire    weight 0.18  ● stale  ⚠            │
  │  ASSUMPTIONS  one row / assumption  (click → basis + who set it)  │
  │  DECISION     why this over the runner-up; what would flip it     │
  └─────────────────────────────────────────────────────────────────┘
```

*Why it matters:* it is the same panel on the Evaluation Workbench, the BAFO Command Center, and the board Cockpit — which means the operator learns one interaction grammar and applies it to every decision. *Problem it solves:* the current pipeline emits trust-or-reject prose; the panel makes every recommendation interrogable and makes *insufficiency visible* — when evidence is `stale` or `low-confidence`, the band shows it, which is the UX half of the governed-insufficiency posture that Volume 2 wires into `source-answer-engine.ts` (today ABSENT; the shipped `disclosure-flag/` classifier is a legal-privilege labeler, not a refusal mechanism — the trace panel must not be confused with it). *Business value:* it is the difference between a tool a CIO advisory board *uses* and one it *audits and discards*. *Implementation:* one component, four props bound to the envelope, rendered in the right rail of every Source surface via the `(maestro)/source/layout.tsx` shell — additive, token-locked, and the cheapest high-leverage UX investment in the entire roadmap.

**Closing scorecard.** Six decision surfaces, one reasoning-trace grammar, one agent toolbar, one density contract — all composing the existing 80-component surface set rather than replacing it. The UX architecture's single thesis: *Source's screens stop displaying answers and start defending them.*

| Surface | Engine (Vol 2/3) | Existing seam | UX state today |
|---|---|---|---|
| Evaluation Workbench | Evaluation Engine | `ScorecardGovernancePanel.tsx` | display-only → make reasoning-anchored |
| BAFO Command Center | BAFO Engine | `AmsBafoPanel.tsx` | fixture-bound → bind live pricing |
| Selection Center | Selection Engine | `SourceExecutiveDecisionSummaryPanel.tsx` | fixture-bound → gate-enforced sign-off |
| Contract Center | Contract Intelligence (Ch 9) | `SourceContradictionCard.tsx` | renderer only → wire clause reasoning |
| Transition Center | Transition Intelligence (Ch 10) | `transition-readiness-view.ts` | binary risk → quantitative readiness |
| Executive Cockpit | Portfolio aggregation | `SourceEventsPortfolio.tsx` | event list → reasoning-aware portfolio |
| Reasoning Trace (all) | Reasoning Envelope (Vol 2) | `multi-agent-types.ts` | ABSENT → keystone build |

---

---

## Chapter 15 — Deliverable Architecture (d01-d33)

### 15.0 Why this chapter exists, and what it changes

Every prior chapter in Volume 3 designed an organ of the operating system — the reasoning engine, the evaluation engine, the agent fabric, the data substrate. This chapter is where those organs produce something a human can sign. The 33 deliverables (`d01`–`d33`, catalogued in `src/lib/source/canonical-specs/artifact-specs.ts`) are the system's externally visible surface: the strategy memo a CIO forwards to a steering committee, the pricing comparison a CFO challenges, the selection memo a board approves, the contract record legal redlines. If the reasoning is invisible inside the machine, the deliverable is where it becomes accountable.

The central argument of this specification — Source is a *sourcing intelligence operating system*, not a document generator — lives or dies in how these deliverables are conceived. In a document generator, a deliverable is a template plus a prompt: text in, text out, the document *is* the product. In an operating system, a deliverable is **the rendered surface of a reasoning act**: the strategy memo is what the analysis stage concluded, the pricing comparison is what the normalization model computed, the selection memo is what the recommendation framework decided. The document is downstream of, and traceable to, the reasoning that produced it. That inversion is the whole game.

The honest current state, grounded in the audit (`_GROUNDING_MAP.md`, `docs/source/STAGE_DELIVERABLES_INVENTORY.md`), is stark and must be stated plainly so this chapter is read as a build spec and not a status report:

- **3 of 33 deliverables generate.** Only `d01_strategy_memo`, `d05_scope_memo`, and `d09_rfp_pack` have live prompt templates in `src/lib/source/agent-generation/prompt-registry.ts`. The remaining 30 exist as lightweight markdown stubs under `src/content/source-templates/<cat>/dNN_*.md` — a heading and placeholder sections, never auto-scaffolded into an event.
- **The export pipeline is broader than the generation pipeline.** `src/lib/source/exports/{format-router,dispatch}.ts` plus 40+ renderers can emit docx/xlsx/html for ~11 deliverable kinds — but their payload builders (`exports/payloads/`) bind to fixtures, not to live vendor submissions, rater scores, or parsed evidence. We can render a pricing comparison; we cannot yet render *this tenant's* pricing comparison from real data.
- **The PDF route works but only binds four artifacts.** `render-pdf/route.ts` is built: it imports `@react-pdf/renderer`, gates on `isPdfGeneratable(artifactCode)`, calls `renderArtifactPdf()`, and returns status-200 PDFs — but only for the four codes with a payload binder and config (`d05`, `d09`, `d24`, `d27`); any other code returns **404** (not yet wired), not a missing-route error. The board-packet deliverables (e.g. `d25`, `d26`, `d28`) cannot ship as PDFs not because the route is missing but because their per-artifact PDF binders and signature blocks are. The real work is *extending* coverage to the remaining codes, never building a PDF path from scratch.
- **Reasoning metadata is absent from every deliverable.** Generated artifacts carry `body_generation_metadata` (model, tokens, prompt version) but no record of *which evidence shaped a claim, what assumptions were tested, what the confidence band is.* This is the gap that keeps deliverables in the "document" category.

This chapter does two things. First (§15.1) it defines a single **Deliverable Contract** — the ten-clause specification every one of the 33 must satisfy — so that "build d16" stops meaning "write a template" and starts meaning "wire a reasoning act to a governed, traceable, exportable artifact." Second (§15.2–§15.7) it applies that contract family by family across all 33, identifying for each its reasoning framework, its quality gates, and its dependencies. §15.8 isolates the load-bearing missing artifacts — the few that, until built, block everything downstream. §15.9 specifies the export, format, and quality-gate architecture that turns a reasoning envelope into a signed document.

---

### 15.1 The Deliverable Contract

A deliverable in a sourcing intelligence OS is not a file format. It is a **contract** between a reasoning act and the humans who consume its output. Today that contract is implicit and partial: `prompt-registry.ts` captures a system prompt, an upstream-artifact list, and a token ceiling — but says nothing about who consumes the output, what reasoning framework produced it, what quality gates it must clear, or who approves it. The result is that the three live deliverables are well-authored prose with no machinery behind them, and the 30 stubs are nothing at all.

We define ten clauses. Every deliverable specification — `d01` through `d33` — must answer all ten before it is considered built. This is the template, applied in §15.2 onward.

| # | Clause | What it specifies | Where it lives in code |
|---|---|---|---|
| 1 | **Purpose** | The single decision or action the deliverable enables. One sentence. | `artifact-specs.ts` `description` |
| 2 | **Consumer** | Who reads it and what they do next (CIO, CFO, evaluation panel, legal, board, downstream deliverable). | new field on `SourceArtifactSpec` |
| 3 | **Inputs** | Upstream deliverables, evidence states, and live data the deliverable requires; hard vs. optional. | `prompt-registry.ts` `upstreamRequired/Optional` + new `evidenceRequired` |
| 4 | **Outputs** | The structured payload the deliverable emits (not just prose) — the shape downstream consumers bind to. | `exports/payloads/*` |
| 5 | **Reasoning framework** | The named analysis the deliverable renders — should-cost, weighted scoring, leverage analysis, risk adjustment. *This is the OS clause.* | Volume 2 engines; `should-cost/`, `proposal-normalization/`, `bafo-negotiation-model.ts` |
| 6 | **Quality gates** | Machine-checkable conditions the output must pass before it surfaces: 0 unsupported claims, 0 leaks, evidence-cited, tier-sufficient. | new per-deliverable gate spec, tied to `gate-criteria.ts` |
| 7 | **Approvals** | The human sign-off required to lock it, and the role that owns that sign-off. | `gate-criteria.ts` `ownerRole`; `source-governance-enforcement.ts` |
| 8 | **Dependencies** | Which gate criteria this deliverable defines or unblocks; what re-opens if it changes. | `artifact-gate-map.ts` |
| 9 | **UI surface** | The workbench or panel where it is authored, reviewed, and drilled into. | `src/components/source/`; Ch14 workbenches |
| 10 | **Prompt / generation architecture** | How it is produced: pure-prose generation, structured-payload generation, deterministic computation, or hybrid. | `prompt-registry.ts` + engine call |

Three clauses deserve emphasis because they are where today's implementation is thinnest and where the OS thesis is enforced.

**Clause 4, Outputs, must be structured — not just prose.** Today `d01` emits markdown and nothing else. A strategy memo whose value target is buried in a sentence cannot be read by the value-at-stake summarizer, cannot seed the should-cost baseline, cannot populate the executive cockpit. The contract requires every deliverable to emit a structured payload alongside its prose body — the value target as a `{low, base, high, confidence}` object, the scope as an inventory of in/out items, the scorecard as criterion-weight-score rows. The renderer architecture in `exports/payloads/` already models this for ~11 kinds (`ScorecardPayload`, `PricingTemplatePayload`); the contract makes it universal and makes the structured payload the *source of truth*, with prose rendered from it rather than parsed back out of it.

**Clause 5, Reasoning framework, is the clause that distinguishes this chapter from a template library.** Each deliverable names the reasoning act it renders. `d02_value_target` renders the should-cost model (`should-cost/should-cost-model.ts`). `d16_scorecard` renders weighted multi-rater consensus (Ch6). `d20_trap_log` renders the 8-dimension pricing-normalization comparison (`pricing-normalization.ts`). The deliverable does not *invent* its content via a generic prompt; it *expresses* a computed reasoning result. This is the difference between "ask Claude to write a pricing analysis" and "compute the normalized comparison, then ask Claude to narrate the computed result with citations." The former hallucinates numbers; the latter cannot, because the numbers arrive pre-computed and the model's job is exposition, not arithmetic.

**Clause 6, Quality gates, makes deliverable quality machine-enforced, not hoped-for.** The Deliverable Intelligence work proven on SkyHarbor established the bar: a board-grade artifact must pass a quality gate of *0 unsupported claims, 0 confidentiality leaks, every material claim evidence-cited.* The contract attaches gates per deliverable: a strategy memo gate checks the value target carries a confidence band; a scorecard gate checks every score links to an evidence citation; a decision brief gate checks no claim lacks an upstream-artifact reference. These gates read from the **reasoning envelope** (Ch5) — the structured record of claims, evidence, assumptions, and confidence that every reasoning step emits — which is precisely why the envelope is the keystone of the whole system. A deliverable's quality is auditable only because the reasoning that produced it is recorded.

**The generation taxonomy (Clause 10).** Deliverables fall into four production modes, and naming the mode per deliverable resolves most of the "how do we build d-NN" question:

```
  MODE A · Prose-led generation       (Claude drafts narrative from bound context + envelope)
           → strategy/scope/decision memos: d01 d02 d03 d05 d06 d24 d27
  MODE B · Structured-payload generation (engine computes payload; renderer emits xlsx/docx; prose narrates)
           → scorecard/pricing/trap: d16 d17 d19 d20 d22
  MODE C · Deterministic computation   (no model; pure builder over substrate; renderer emits)
           → logs/registries/ledgers: d14 d18 d23 d28 d30 d31 d32
  MODE D · Hybrid                      (deterministic skeleton + model narration of computed result)
           → premortem/disqualification/risk attestation: d08 d18 d25 d33
```

Modes B and C are where the OS earns its defensibility: numbers come from engines and substrate, never from a language model's imagination. Mode A is where it earns its readability. The current system implements only a degenerate Mode A (generic prompt, no envelope) for three deliverables.

---

### 15.2 Strategy & Scope Family (d01–d08)

This family establishes the fact base and the boundary of the event — the work elite operators (McKinsey, Kearney) do *before* going to market. It is the only family with any live generation today (`d01`, `d05`).

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d01** strategy memo | Frame why-now, what, value target, archetype, rigor | A (LIVE) | Archetype + rigor heuristic (`prompt-registry.ts`) → should-cost (target) | Value target carries confidence band; decision owner named | Sponsor → steering committee |
| **d02** value target | Quantify the savings/value envelope to defend | A→B | `should-cost/should-cost-model.ts` (clean-sheet baseline) | Target is `{low,base,high}` with stated assumptions | CFO / sponsor |
| **d03** archetype decision | Record the archetype × estate classification and its rigor consequences | D | `classifier/category-classifier.ts` `classifySourcingEvent()` | Classification cites the trigger evidence; rigor justified | Sentinel / governance |
| **d04** app inventory | Enumerate in-scope applications/systems with disposition | C | Deterministic over uploaded landscape (`app-inventory-payload.ts`) | Every row has a disposition; no orphan systems | Scope lead |
| **d05** scope memo | Define in/out boundary, exclusions, dependencies | A (LIVE) | Two-gap (foundation vs. use-case) framing | Exclusions cross-referenced to d06; no scope ambiguity | Scope lead → RFP |
| **d06** exclusion log | Record what is deliberately out of scope, with rationale | C | Deterministic register | Each exclusion has a rationale and an owner | Scope lead |
| **d07** ticket synthesis | Synthesize L2/L3 ticket/run-rate history into demand signal | B/D | Run-rate analysis over parsed ticket evidence | Synthesis cites ticket-history evidence state ≥ Parsed | Demand analyst |
| **d08** premortem | Anticipate failure modes of the sourcing approach before market | D | Red-team / challenge model (Ch5) | ≥1 mitigation per identified failure mode | Sponsor / Sentinel |

**The d01 reality and the d02 dependency.** `d01` is live and genuinely useful: its system prompt (`prompt-registry.ts`) instructs a 600–1200 word memo across five §-sections and *does* ask for a value target "as a range with confidence band when the intake provided one." But "when the intake provided one" is the tell — today the range is whatever a human typed at intake, not a computed should-cost baseline. The architectural upgrade is to make `d02_value_target` a Mode-B deliverable that *runs* `buildShouldCostEstimate` (`should-cost/should-cost-model.ts`) over the event's category and landscape, emits a `{low, base, high, confidence, assumptions[]}` payload, and then `d01` *consumes that payload* rather than reciting an intake field. This is the first place the "documents are outputs of reasoning" thesis becomes concrete: the value target is computed, then narrated.

**d03 activates the dormant classifier.** `classifySourcingEvent()` exists and runs only inside the dormant `source-answer-engine.ts` and fixtures — never in the live generation path. Making `d03_archetype_decision` a real deliverable is the forcing function that wires classification into the live pipeline: at intake the classifier produces a `CategoryClassification`, `d03` renders it as an auditable decision record (archetype, estate, rigor, and the evidence that drove each), and that classification then parameterizes every downstream deliverable's rigor and evidence thresholds. The archetype stops being a string on a row and becomes the governing variable it was designed to be.

---

### 15.3 RFP & Responses Family (d09–d15)

This family takes the event to market and ingests what comes back. `d09` is live; `d10`–`d15` are stubs. The pivotal architectural fact is that **d13–d15 are the first deliverables that depend on parsed external evidence** — uploaded vendor responses — and therefore the first to exercise the parse → evidence-state → reasoning chain that the system has modeled but never run on live data. Note that `artifact-registry/text-parser.ts` is only the first-mile text/Markdown/CSV parser (it handles pasted notes / Markdown / text / CSV via `extractLabeledLines`/`extractPricingComponents`; it does *not* import `mammoth`, `pdf-parse`, or `exceljs`); the binary (docx/pdf/xlsx) extraction these deliverables ultimately need is **net-new for Source** — either a new capability or a reuse of the Moves-side async pipeline under `src/lib/programs/` (doc-parser, attachments/extract-text), not an extension of `text-parser.ts` (see Ch9).

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d09** RFP pack | The issued requirements + evaluation criteria + commercial template | A (LIVE) | Scope (d05) → requirements decomposition | Every requirement traces to scope; criteria + weights present | Sourcing lead → vendors |
| **d10** RFI summary | Synthesize market RFI responses into a shortlist hypothesis | B | Market-scan synthesis | Synthesis cites each RFI source | Sourcing lead |
| **d11** response checklist | The completeness rubric vendors must satisfy | C | Deterministic from d09 sections | Checklist covers 100% of d09 mandatory items | Sourcing lead → vendors |
| **d12** vendor shortlist | The qualified set advancing to evaluation, with rationale | D | Qualification scoring + risk screen | Each include/exclude has a cited rationale | Sourcing lead → panel |
| **d13** vendor responses | Registered, parsed vendor submissions | C | First-mile `text-parser.ts` (text/CSV) + net-new async binary extraction | Parse status = Parsed; evidence rows created | System → evaluation |
| **d14** Q&A log | The vendor clarification trail | C | Deterministic register | Every Q linked to the affected requirement | Sourcing lead |
| **d15** response completeness | Per-vendor gap report vs. the d11 checklist | B | Completeness diff (checklist × parsed response) | Gaps cite the missing checklist item | Panel / Sentinel |

**Why d15 is more than a report.** `d15_response_completeness` already has a renderer (`exports/renderers/response-checklist`) — but its payload is fixture-bound. The contract makes it a Mode-B deliverable that diffs the parsed vendor response (from `d13`) against the `d11` checklist and emits a structured gap list. This is the system's first live demonstration that *uploaded documents drive reasoning*: until a vendor response is parsed into evidence and diffed against a requirement rubric, the system cannot honestly say a vendor is "complete." Today it could only assert completeness from a fixture. This deliverable is the proof point that the parse-to-evidence-to-reasoning chain works end to end, and it gates the evaluation family that follows.

---

### 15.4 Evaluation Family (d16–d18)

This family is where the **vendor evaluation engine** (Ch6) surfaces. Today the scorecard (`d16`) is display-only: a renderer with no scoring engine behind it. The contract turns the evaluation family into the rendered output of weighted multi-rater consensus.

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d16** scorecard | Consensus weighted scores and ranking across vendors | B | Weighted multi-rater consensus (Ch6) | Every score links to ≥1 evidence citation; weights sum to 100 | Panel chair → selection |
| **d17** weight log | The governed record of criterion weights and any changes | C | Deterministic weight-change audit | Each weight change has an owner + timestamp + rationale | Panel chair / governance |
| **d18** disqualification log | The evidence-anchored rationale for each disqualified vendor | D | Disqualification chain (criterion → evidence → decision) | Each DQ cites the failing criterion and its evidence | Panel chair → legal |

**The scoring engine is the missing reasoning, not the missing template.** The renderer for `d16` exists; what is absent is the consensus model: per-rater submissions, criterion weights governed via `d17`, aggregation, calibration, and the >5-point deviation flag that triggers a re-rate. `d16`'s quality gate — *every score links to an evidence citation* — is the bar that separates an opinion-scorecard from a defensible one. A score of 7/10 on "delivery reliability" that points to nothing is litigable; a 7/10 that cites the vendor's parsed reference-customer evidence and a specific SLA-history line is defensible. `d18`'s gate is the same discipline applied to exclusion: a disqualification that cannot cite the criterion it failed and the evidence of failure is a lawsuit waiting to happen. These three deliverables are the first family where *legal defensibility* is the operative quality bar, and they are why the evidence-citation clause (Clause 6) is non-negotiable.

---

### 15.5 Pricing & BAFO Family (d19–d23)

This is the **commercial core** and it contains the single most load-bearing gap in the entire system. The pricing-normalization model (`pricing-normalization.ts`) — eight dimensions: scope, assumptions, rates, accelerators, IP, security, transition, SLAs — is built but runs over an empty proposal set. The BAFO models (`bafo-negotiation.ts`, `bafo-negotiation-model.ts`, `bafo-scenario-compare-view.ts`) are fixture-bound with no live call-site.

The canon (`artifact-specs.ts`) carries a single pricing code, `d19` (`d19_pricing_workbook`). The pricing *work*, however, is naturally a chain: the workbook is issued, filled, parsed back, normalized, and trap-scanned. To make that chain buildable we decompose `d19` into proposed net-new sub-artifacts — **`d19a`/`d19b`/`d19c`, which are not in the 33-code canon** but informal sub-steps of the canonical `d19` — flowing into `d20`:

```
  d19a PRICING TEMPLATE  ──issued to vendors──▶  vendors fill it
  (structured workbook)                              │
        │                                            ▼
        │                              d19b VENDOR SUBMISSIONS  (parsed back in)
        │                                            │
        └──────────normalization matrix──────────────┤
                                                      ▼
                            d19c PRICING COMPARISON  (8-dimension normalized)
                                                      │
                                                      ▼
                                       d20 TRAP LOG  (computed anomalies + narration)
```

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d19a**¹ pricing template | The structured workbook vendors price into | C | Deterministic from scope + cost model | Cells cover every cost dimension; locked formulas | Commercial lead → vendors |
| **d19b**¹ vendor submissions | Parsed, normalized vendor pricing | C | Parse → `pricing-submissions/dao.ts` | Every submission mapped to template cells | System → normalization |
| **d19c**¹ pricing comparison | Apples-to-apples normalized comparison | B | 8-dim `pricing-normalization.ts` | Normalization assumptions stated per dimension | CFO / commercial lead |
| **d20** trap log | Computed pricing traps (ramps, exclusions, escalators) | B/D | `commercial-risk-detection.ts` over normalized data | Each trap cites the submission cell that triggered it | Commercial lead / Sentinel |
| **d21** assumption set | The normalization assumptions governing the comparison | C | Deterministic register | Every comparison adjustment references an assumption | Commercial lead |
| **d22** BAFO question pack | Per-finalist negotiation asks, concession ladder, walk-away | B | Leverage analysis (`bafo-negotiation-model.ts`) | Asks cite the d19c gap or d16 deviation they target | Negotiation lead |
| **d23** BAFO round log | The concession tracker: rounds, gives/gets, residual gap | C | Deterministic round register | Each round records give, get, and residual | Negotiation lead → selection |

¹ `d19a`/`d19b`/`d19c` are **proposed net-new sub-artifacts, not canonical codes** — the canon has only `d19` (`d19_pricing_workbook`). They are named here only to make the pricing chain's build sequence explicit.

**d19a is the keystone the entire commercial layer hangs from.** The inventory (`STAGE_DELIVERABLES_INVENTORY.md`) flags the structured pricing template explicitly as the single most load-bearing missing artifact, and the logic is unforgiving: until a *structured* pricing template is issued, vendors return prose PDFs and free-form spreadsheets; without a structured template, there is no deterministic way to parse submissions into comparable cells (`d19b`); without comparable cells, the 8-dimension normalization (`d19c`) runs over nothing; without normalization, the trap log (`d20`) has no anomalies to detect and the BAFO question pack (`d22`) has no leverage to compute. The renderer for the pricing template *exists* (`exports/renderers/pricing-template.ts`); the *generator that produces a tenant-specific template from the event's scope and cost model* does not. This is a Mode-C deliverable — pure deterministic construction from the scope inventory and should-cost dimensions — and it is the highest-leverage single artifact to build because it unblocks five downstream deliverables and the entire negotiation engine. Estimated commercial impact of getting the negotiation chain live is material — concession capture in the high single-digit to low double-digit percentage of contract value (illustrative range) — but *zero* of it is reachable until `d19a` issues a structured template.

**d22 promotes negotiation from prose to leverage.** Today the BAFO levers in `bafo-negotiation-model.ts` are seeded, not computed. The contract makes `d22` a Mode-B deliverable whose asks are *derived* from concrete gaps: a `d19c` pricing dimension where one finalist runs over the should-cost baseline by a material margin (illustrative range) becomes a specific concession ask; a `d16` score deviation becomes a clarification demand. The quality gate — *every ask cites the d19c gap or d16 deviation it targets* — is what makes the negotiation pack defensible to a sponsor and actionable to a counterparty, rather than a generic list of "ask for a discount."

---

### 15.6 Executive Decision & Selection Family (d24–d28)

This family is where the **selection intelligence engine** (Ch8) produces a board-grade recommendation. It is the family with the hardest output requirement — signed PDFs — and the PDF route already serves two of its codes (`d24`, `d27`); the remaining gap is per-artifact PDF binders for the rest of the deal pack, not a missing route.

A naming note that must be reconciled before these artifacts ship to a customer: the repo's d24 template is literally titled *"Atlas Decision Brief"* and `d26` is named for *Steward*. Under the one-front-agent doctrine, **Sentinel is the single front agent for Source**; Atlas, Nexus, and Steward are internal voices, not competing front-agent brands. A Source decision packet must therefore present a single Sentinel-fronted face — the Atlas/Steward labels are internal lineage and should not surface as three separate brands on a board-bound document.

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d24** decision brief | The board-grade award recommendation with options + rationale | A | Risk-adjusted ranking + recommendation framework | Recommendation carries calibrated confidence band; options ranked | Board / sponsor |
| **d25** risk attestation | The named, owned, mitigated risk register behind the decision | D | `commercial-risk-detection.ts` + impact×probability×mitigability | Each risk has owner + mitigation; no unowned high risk | Sponsor / governance |
| **d26** Steward sign-off | The governance attestation that gates were met or waived | C | `source-governance-enforcement.ts` gate evaluation | Every hard gate is met or has a logged waiver | Steward |
| **d27** selection memo | The defensible written rationale for the awarded vendor | A | Recommendation + tie-break logic | No claim lacks an upstream-artifact reference | Sponsor → legal |
| **d28** contract record | The anchor record linking award to the signed contract | C | Deterministic + clause extraction (Ch9) | Contract terms reconcile to d22 BAFO outcome | Legal / commercial |

**The board packet must be one coherent, signed artifact.** `d24`, `d25`, and `d26` are not three independent documents; they are a *deal pack* — a decision brief, the risk attestation that backs it, and the Steward sign-off that governs it — assembled into a single board-consumable packet with signature blocks. Two architectural facts shape this today: the deal-pack route (`/api/v1/source/[eventId]/deal-pack`) already assembles a combined document and returns 200 — its real gap is **multi-artifact ZIP bundling** (composing several discrete deliverables into one downloadable package), not that it does nothing; and the PDF route, while built (`render-pdf/route.ts` renders status-200 PDFs via `@react-pdf/renderer`), returns 404 for codes without a wired binder — it carries binders and configs only for `d05`/`d09`/`d24`/`d27`, so `d25` and `d26` are not yet PDF-renderable. The contract requires (a) the deal-pack assembler extended to bundle the three deliverables plus their reasoning envelopes (including ZIP packaging where multiple artifacts ship together), and (b) the existing PDF route extended with per-artifact binders for `d25`/`d26` plus signature blocks, so the packet ships as a signed PDF rather than a docx that loses fidelity. Until both exist, the system can reason its way to a board recommendation but cannot *deliver* it in the form a board accepts.

**d24's confidence band is the trust currency.** Today `executive-decision-summary.ts` derives a binary posture. The contract replaces it with a calibrated confidence band (Ch5's confidence model: evidence sufficiency × score margin × unresolved assumptions). A board that is told "recommend Vendor B, confidence: high (score margin 14 points, all hard gates met, 1 open assumption on transition staffing)" can make a decision; a board told "recommend Vendor B" with no confidence calculus is being asked to trust a black box. The quality gate — *no claim lacks an upstream-artifact reference* — is what lets a dissenting board member drill from any sentence in `d27` back to the `d16` score or `d19c` comparison that produced it.

---

### 15.7 Transition & Value Family (d29–d33)

This family closes the lifecycle: from signed contract to running service to measured value. It is almost entirely unbuilt as live generation, and today's transition risk is "binary keyword-derived" (`transition-readiness-view.ts`) rather than a quantitative readiness model.

| Code | Purpose | Mode | Reasoning framework | Key quality gate | Owner / consumer |
|---|---|:--:|---|---|---|
| **d29** transition plan | The KT, parallel-run, cutover, rollback plan | A→B | Quantitative readiness scoring (Ch10) | Plan has rollback depth + cutover sequence; readiness scored | Transition lead |
| **d30** checkpoint log | The transition milestone/checkpoint tracker | C | Deterministic register + slip detection | Every checkpoint has owner + date + status | Transition lead |
| **d31** KT evidence | What knowledge moved, verified by whom, gaps flagged | C | Deterministic evidence tracker | Each KT item verified-by named; gaps flagged | Transition lead / Steward |
| **d32** value ledger | Contracted value commitments vs. measured realization | C | `value-ledger.ts` variance tracking | Each commitment links to a measurement + variance | Sponsor / CFO |
| **d33** governance review | The periodic governance review of the running engagement | D | Variance + risk re-assessment | Review cites d32 variances and d25 risk status | Governance / board |

**d32 closes the loop the OS exists to close.** The entire point of a sourcing intelligence operating system is that the value targeted in `d02` is *defended through the lifecycle and measured at the end.* `d32_value_ledger` is the deliverable that makes that accountability real: it binds each contracted commitment (from `d28`) back to the value target (`d02`) and forward to a measured realization, surfacing variance. Today `value-ledger.ts` exists in skeleton with minimal implementation and no path connecting commitments to measurement. The contract makes `d32` a Mode-C deliverable computing variance from substrate, and `d33` a Mode-D review that narrates it — turning the system from "we ran a sourcing event" into "we captured the value we promised, and here is the evidence."

---

### 15.8 The load-bearing missing artifacts

Of the 30 unbuilt deliverables, a small set are *load-bearing* — they block disproportionate downstream value and must be sequenced first. Ranked by leverage:

| Rank | Artifact | Why load-bearing | Unblocks |
|:--:|---|---|---|
| 1 | **d19a pricing template** (Mode C) | No structured template ⇒ no parseable submissions ⇒ no normalization ⇒ no trap log ⇒ no leverage | d19b, d19c, d20, d22, the entire BAFO engine |
| 2 | **The reasoning envelope binding** (cross-cutting) | Every Clause-4 structured output and Clause-6 quality gate reads from it | Quality gates on all 33; reasoning-trace UI |
| 3 | **d02 value target** (Mode B, should-cost) | Computed baseline ⇒ defensible d01, d19c deviations, d32 measurement | d01 quality, d19c gaps, d32 variance |
| 4 | **d16 scoring engine** (Mode B) | Display-only scorecard ⇒ no defensible ranking | d18, d24, d27 (the whole decision chain) |
| 5 | **d13/d15 parse-to-evidence chain** | First live use of uploaded-document reasoning (net-new binary extraction for Source) | d16 evidence citations, d20 trap detection |
| 6 | **d25/d26 PDF binders** (extend existing route) | The PDF route is built and serves d24/d27; the deal pack lacks per-artifact binders for d25/d26 | d24–d26 deal-pack delivery as signed PDF |

The sequencing logic is causal, not arbitrary: `d19a` unblocks the commercial engine, the reasoning envelope unblocks every quality gate, the should-cost baseline unblocks defensible value claims end to end. These six, built in order, convert roughly nine-tenths of the deliverable surface from "stub" to "reachable."

---

### 15.9 Export, format, and quality-gate architecture

The deliverable contract terminates at the export layer, which is — uniquely in this subsystem — *more* mature than the generation layer it serves. The architecture is a three-stage pipeline already substantially built in `src/lib/source/exports/`:

```
  reasoning envelope + structured payload
            │
            ▼
   [ payloads/ ]  builder binds envelope → typed payload (ScorecardPayload, PricingTemplatePayload …)
            │
            ▼
   [ format-router.ts ]  kind + requested format → allowed? → renderer
            │                (narrative = docx/html/pdf · structured = xlsx/docx/pdf)
            ▼
   [ dispatch.ts → renderers/ ]  40+ renderers emit docx (docx lib) · xlsx (exceljs, write-only) · html · pdf
```

Three architectural priorities complete it.

**Bind payloads to live data.** The single largest export gap is not missing renderers — it is that payload builders bind to fixtures. The pricing-template payload does not read live vendor submissions; the scorecard payload does not read rater submissions or weight deltas; the trap-log payload does not parse vendor narratives. The contract's Clause 4 (structured outputs) resolved at the engine layer fixes this at the source: when `d16` *is* the rendered output of the scoring engine and `d19c` *is* the rendered output of the normalization model, the payload builder reads computed reasoning, not a fixture. The renderers were built ahead of the reasoning; the reasoning is what makes them honest. (Note `exceljs` here is used only to *write* xlsx exports — it is not a vendor-response reader; reading binary vendor submissions is the net-new parsing capability flagged in §15.3.)

**Extend the PDF binders to the full deal pack.** The PDF route is built — `render-pdf/route.ts` gates on `isPdfGeneratable()` and renders status-200 PDFs through `@react-pdf/renderer` — but it only carries payload binders and configs for four codes (`d05`, `d09`, `d24`, `d27`); any other artifact returns 404 (not yet wired). The board-decision family needs `d25`/`d26` to render too, so the discrete, sequenced build (load-bearing item 6) is per-artifact PDF binders plus signature blocks for the rest of the deal pack, not a new route — without them the system reasons to a recommendation it cannot deliver in full board-acceptable form.

**Make quality gates machine-checkable and envelope-fed.** The final architectural move binds Clause 6 to the export pipeline: no deliverable renders for sign-off until it passes its gates, and the gates read the reasoning envelope. The universal gates — *0 unsupported claims, 0 confidentiality leaks, every material claim evidence-cited* — apply to all 33; the per-deliverable gates (value-target confidence band, scorecard evidence links, BAFO ask-to-gap citations) apply per family as tabulated above. A deliverable that fails a hard gate does not silently render; it surfaces the failure as a gap (the Sentinel voice doctrine, `src/lib/agent/voice-doctrine/sentinel.ts`: *lead with the gap*), routes to the owning role for waiver or remediation via `source-governance-enforcement.ts`, and is blocked from locking until the gate clears or a waiver is logged. This is the mechanism that makes deliverable quality a property of the system rather than a property of the operator's diligence — and it is the final expression of the chapter's thesis: a deliverable is the signed, governed, traceable surface of a reasoning act, and its quality is exactly as auditable as the reasoning beneath it.

**The disclosure-flag interaction.** One clarification prevents a common conflation: `disclosure-flag/` is a *shipped legal-privilege classifier* — it marks a deliverable as attorney-client or work-product and inherits that flag to downstream derived artifacts. It is **not** a market-data disclosability tagger and **not** an evidence-insufficiency refusal mechanism. The quality gates above are the refusal-on-insufficient-evidence posture, and that posture is net-new — it would wire into the generation path (extending `source-answer-engine.ts` and the per-deliverable gate spec), distinct from the privilege classification that disclosure-flag already performs. A deliverable can be both *privilege-flagged* (disclosure-flag) and *gate-blocked* (quality gate); they are orthogonal governance layers, and the contract requires both.
