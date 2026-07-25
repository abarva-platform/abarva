# Source Readiness Audit Against the Moves Standard

## Status

`audit — no code changed by this document`. Every finding below is grounded in a direct file/line
read against `origin/main` (verified current as of 2026-07-23; several files were re-checked
against `origin/main` directly rather than a local worktree, which drifted on Source paths earlier
this session). This package intentionally stops at documentation — per the audit brief, no large
implementation change should start until this is reviewed.

## Framing note before the findings

The comparison baseline is "the new Moves standard." One caveat worth stating up front:
`docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md` (an existing document in this repo, dated this
session) shows Moves itself still runs **two parallel generation pipelines** today — golden-bar and
orchestrator — with the rigor improvements (typed word-budget contracts, a real blocking quality
bar) landing cleanly on only the orchestrator path, and it is not fully confirmed which path the
live "Approve & Build" button always uses. So "bring Source to the Moves standard" is read here as
*apply the same governing principles* (typed contracts, explicit stage boundaries, distinct
draft/review/approve/publish states, evidence-traceable claims), not *copy Moves' current code
verbatim* — Moves' own house is not fully in order either, and Source should not inherit its
dual-pipeline drift as a design goal.

---

## A. Source Architecture Map — the full runtime path

**Entry points (three, not one):**
- `UniversalCanvasShell.handleArtifactGenerate` (`src/components/source/canvas/UniversalCanvasShell.tsx:744`) → `POST /api/v1/source/:eventId/artifacts/:artifactCode/generate` — the primary, explicit-click path.
- `EventApprovalCard.tsx:195` chains the same route immediately after a Strategy-gate approval — the "no Build buttons" auto-generate convention, confirmed real.
- **A third, separate route**: `AtlasDrawer.tsx:1279` posts chat-authored markdown to `POST /api/v1/source/:eventId/artifacts/generate` (no `:artifactCode` segment) — see Pipeline Drift Report, item D1.

**Generation orchestration**: one real pipeline. `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` (1,414 lines) *is* the orchestrator — there is no separate orchestrator module (`agent-generation/server.ts` is a 31-line re-export barrel). It reads `prompt-registry.ts` templates, calls `preflightAnthropicDirectClient`, and uses per-template `maxTokens` defined only in `prompt-registry.ts`.

**Validation**: tiered, not uniform (full detail in section D and the Quality Validation section below).

**Rendering**: one shared renderer barrel (`@/lib/source/exports`, `exports/dispatch.ts` → `renderSourceDeliverable`) fans out to per-artifact-family renderer files (`exports/renderers/*`). No competing rendering *engine* exists, but per-family renderer triads (docx/html/pdf) are independently maintained and can drift from each other (Visual/Rendering section).

**Review/approval/publication states**: real and distinct — `artifact-governance.ts:93-97` defines `ai_draft → human_review → approved_for_external_use → client_final`; `source_artifact_acceptances` is a separate, append-only "accept as authoritative" ledger. But `resolveAuthoritativeArtifact` (`client-final-artifacts.ts:56-85`) falls back through `approved/locked status → artifactGroup === "generated" → any current artifact` when no acceptance exists — so a merely-generated, never-reviewed artifact **can** resolve as "authoritative" by design, not bug. This is the exact ambiguity the audit brief asked about; see Approval State Machine section for the full waterfall.

**Audit lineage**: real and durable for the primary path. `SourceArtifactBodyGenerationMetadata` (`agent-generation/types.ts:32-72`) persists model id, prompt template id+version, upstream-bound codes, token counts, quality-gate result, section verification, and banned-term matches on every generation — a single joinable record. The chat-save bypass route (D1 below) produces **none** of this metadata.

---

## B. Artifact Inventory (representative, not exhaustive — ~35+ codes registered)

| Code | Stage | Quality-gated? | Upstream required | Notes |
|---|---|---|---|---|
| `d01_strategy_memo` | Strategy | **Yes** | none | no numeric word target at all |
| `d05_scope_memo` | Scope | **Yes** | (upstream of d09) | |
| `d09_rfp_pack` | RFP | **Yes** | d01, d05 | 11 sections, 128k maxTokens, block_until_complete |
| `d13_vendor_response_pack` | RFP/Responses | No | — | explicit "never promote unsupported claims as facts" prohibition |
| `d15_response_completeness` | Responses | No | — | explicit "must not rank vendors on merit" prohibition |
| `d16_scorecard` | Evaluation | No | — | optional upstream to d24 (see D2 below) |
| `d19_pricing_workbook` | Pricing | No | — | optional upstream to d24 |
| `d24_decision_brief` | Executive Decision | **Yes** | **none** (`upstreamRequired: []`) | recommendation-first structure; explicit "do NOT invent vendor names/scores/prices" |
| `d27_selection_memo` | Selection | **Yes** | d24, d25, d26 (hard) | correctly gated, unlike d24 |
| `d28_contract_record` | Selection/Decision | No | — | explicit "do not mark signed unless evidence says so" prohibition |
| `d02_value_target` / `_legacy` | Strategy | No | — | two live variants with different word targets and 2x maxTokens gap |
| `d03_archetype_decision` / `_legacy` | Strategy | No | — | same pattern — diverging numbers, no shared source |
| `d24_decision_brief_legacy` | Executive Decision | — | — | 5,000 maxTokens vs current variant's 24,000 default — ~5x gap for nominally the same artifact |

**Governance/access profile** (`source-artifact-profiles.ts`) is independently maintained from the prompt registry — confirmed consistent for the fields checked (d09: vendor audience, client-facing, `block_until_complete`, banned internal labels) but the two files are two separate sources of truth with no shared type binding them.

---

## C. Before/After Matrix — extended with real code findings

The user-provided deliverable-by-deliverable tables (Sourcing Strategy, RFP, Proposal Intake,
Compliance Matrix, Weighted Evaluation, BAFO, Executive Decision, Existing-Contract) describe the
target state accurately relative to what this audit confirmed. Rather than restate all eight tables
verbatim, here is what's **already real** vs. **still aspirational** per deliverable, condensed:

- **Sourcing Strategy (d01)**: purpose/story framing exists in the prompt (advisor-voice, decision-first). No numeric word band, no shared contract. Real gap: none of the "required future standard" mechanics (fixed section list with word targets, visual spec) exist as anything other than prose.
- **RFP (d09)**: closest to the target state of any artifact. 11 fixed sections, mandatory table list, protected §7-11, a real 15-exhibit evidence coverage map with stable `EVID-SRC-*` requirement IDs, `block_until_complete` policy. This is the one artifact this session already built a facilitator guidebook for (see Guidebook status below) — genuinely strong.
- **Vendor Proposal Intake and Digest**: **the largest real gap in the entire audit.** See Evidence Ingestion Audit — no requirement-ID-linked structured extraction exists for proposals; a regex line-matcher over generic markdown text is the entire mechanism, and it mostly fails to fire on real proposal prose (which doesn't look like `label: value` lines).
- **Compliance Matrix**: no dedicated artifact/table found matching this description as a first-class Source deliverable — closest analog is `d15_response_completeness`, which is explicitly prohibited from ranking vendors, not built to produce a comply/partial/exception matrix with citations.
- **Weighted Evaluation (d16 scorecard)**: exists, but is `upstreamOptional` to the Decision Brief rather than required — a scored comparison can be silently absent from the artifact that makes the recommendation.
- **BAFO pack**: real artifact codes exist in the d20s range per the registry, not independently deep-audited this pass — flagged as a follow-up read, not confirmed either way.
- **Executive Decision Brief (d24)**: prose and prohibition language is strong ("do NOT invent vendor names, scores, or prices"), but the **code-level gate is the weakest of any late-stage artifact** — `upstreamRequired: []` means it can be drafted with zero enforced evidence, relying entirely on the model honoring the prompt text.
- **Existing-Contract Optimization**: real, non-trivial deterministic calculation engines exist (leakage, staffing-gap, change-order exposure, posture derivation) — but split across **three disconnected modules**, one of them **hard-coded to a single tenant** (`isSkyHarborContractOptimizationEvent()` gates on `client_key === "skyharbor"/"skyharbor-air"` literally), and none of the three do real MSA/SOW/invoice PDF-to-clause parsing — the obligation data is demo-fixture-shaped (a free-text `evidenceId` string set once by a seed script), not extracted.

---

## D. Pipeline Drift Report

1. **A real bypass, not full duplication.** `artifacts/generate/route.ts` (no artifact-code segment) never calls `prompt-registry.ts` or Anthropic — it persists arbitrary pre-authored markdown from Atlas chat as a "Source artifact" with **zero** section-conformance check, banned-term scan, consulting-grade rubric, or generation metadata. Anything saved this way is invisible to every downstream quality/lineage mechanism.
2. **`d24_decision_brief` has no upstream gate** (`upstreamRequired: []`) despite needing `d16_scorecard`/`d19_pricing_workbook` — those are optional. Contrast with `d27_selection_memo`, which correctly hard-requires its three upstream artifacts. Inconsistent gating policy across artifacts at similar risk levels.
3. **Word/token budgets are prose-only, per-template, and already measurably diverging**: `d02_value_target` current vs. `_legacy` variant (600-1000 vs 500-900 words, 12k vs 24k maxTokens); `d03_archetype_decision` current vs `_legacy` (500-900 vs 400-800); `d24_decision_brief` current vs `_legacy` (1200-2400 vs 800-1600 words, **24,000 vs 5,000 maxTokens** — a 4.8x gap for the same nominal artifact). No shared `wordBudget`/`maxOutputTokens` type exists anywhere in Source (Moves has one: `strategic-moves-artifact-standard.ts`, `shared/artifact-contracts.ts`); Source's `quality-review.ts` never reads or checks any of these numbers.
4. **A live, already-real duplication case**: `d09-map-reduce.ts` (feature-flagged off by default) hand-copies the exact same per-section word caps from `prompt-registry.ts`'s d09 "Section budget" block into its own `D09_PARALLEL_SECTIONS` prompt text, with no shared constant. If either copy is edited without the other, they silently diverge — the map-reduce path is currently off, but the drift risk is real and already latent in the codebase, not hypothetical.
5. **Quality gate applies to 5 of ~35+ registered codes**, gated by a hardcoded artifact-code allowlist (`SOURCE_CONSULTING_GRADE_GATE_CODES`), not by content complexity as hypothesized in the audit brief — the practical effect is the same (most artifacts never get the one actually-blocking check), but the mechanism is simpler to fix than "detect complexity."
6. **Visual/exhibit renderer families drift independently** — governance-notice banners are used by 6 of ~14 structured artifact renderer families (app-inventory, narrative, pricing-template, renewal-decision, response-checklist, scorecard) and absent from the rest (bafo-question-pack, market-scan, pricing-comparison, tco-iceberg, trap-log, ai-clause-gap, deal-pack, cxo-report) — partial, not uniform, adoption of a shared helper that already exists.
7. **Existing-contract logic is triplicated**: `contract-optimization/`, the generic `CONTRACT_RENEWAL` archetype in `archetypes/registry.ts`, and `renewal-cockpit/cockpit.ts` each independently compute a renewal/optimization posture with zero cross-references between them.

---

## E. Evidence Ingestion Audit — the deepest gap

**Structured-fact ingest (numeric, CSV-only) is real and proven this session**: `POST
/api/v1/source/{eventId}/facts/ingest-file` with `RESPONSE_COVERAGE_V1` / `COMMITTED_VALUE_V1` /
`BAFO_CONCESSIONS_V1` / `VALUE_REALIZATION_V1` templates write typed, cited, tenant-scoped rows to
`source_event_facts` — this is genuinely governed (fact_key/entity_kind/entity_ref/citation/
confidence/is_stale) and was used twice this session to seed real vendor-coverage and value-ledger
data for SkyHarbor.

**Document/proposal ingest (the deliverable the audit brief cares most about) is far weaker:**

1. **No requirement-level typed extraction for vendor proposals.** Binary docs (PDF/XLSX/PPTX) go
   through `extractSourceUploadText` → the *same generic* `parseSourceTextArtifact` used for pasted
   markdown — a regex line-matcher looking for literal `label:` prefixes (`requirement:`,
   `commitment:`, `sla:`, `risk:`). Real proposal prose does not look like `label: value` lines, so
   this mostly produces zero structured facts from a real proposal PDF — just bounded text chunks.
   `source_commercial_exceptions` (a real, purpose-built table for exactly this) has **zero
   application code** reading or writing it — a dead table.
2. **No confidence scoring, no review gate.** Confidence values written by the parser are fixed
   constants (0.72-0.9), not computed. Nothing in the generation-context binder or the aVa chat
   route filters by `approval_state`, `evidence_state`, or a confidence threshold — even
   `parse_status='failed'` rows aren't excluded. There is no UI surface for a human to confirm or
   correct an extracted fact. Extraction is write-only.
3. **XLSX parsing is naive.** `exceljs`-based, iterates up to 8 sheets/200 rows/40 cols, dumps as a
   markdown table. Formula cells use only the cached computed value (never the formula itself);
   merged cells get **no handling** — only the anchor cell renders, the rest go blank. Not
   schema-aware, no unit/currency/volume-tier/escalation handling as the audit brief's pricing-
   workbook checklist requires.
4. **Model-visible packet is size-bounded, not governance-bounded.** `formatDraftEvidenceContext`
   correctly caps evidence sent to the model (8 artifacts, 6 facts, 500-char excerpts) — a real,
   deliberate boundary. But that boundary filters by *size*, not by review/approval state, so
   unreviewed or low-confidence content is just as visible to the model as reviewed content.
5. **Tenant isolation is effectively vestigial at this layer.** RLS policies exist at the migration
   level (`tenant_key = auth.jwt()->>'tenant_key'`), but the actual runtime client
   (`getAzureWriteFluentClient`/`getAzureReadFluentClient`) is a raw `pg.Pool` connection to Azure
   Postgres, not Supabase/PostgREST — so `auth.jwt()` has no session context and the RLS policy
   never actually executes. Isolation depends entirely on the application layer re-asserting
   `client_key`/`tenant_key` on every query, and at least one confirmed read path
   (`listUploadedEvidenceForGeneration`) does not re-assert it at the query itself.

---

## F. Recommended Shared Contracts

Propose typed contracts, mirroring what already exists for Moves (`strategic-moves-artifact-
standard.ts`, `shared/artifact-contracts.ts`) rather than inventing a new pattern:

- **`SourceArtifactContract`** (per the shape in the audit brief) — one canonical source of truth
  reconciling what's currently split across `prompt-registry.ts` (prose limits), `source-artifact-
  profiles.ts` (governance/access), and `section-conformance.ts` (required headings). All three
  currently agree by convention, not by type — a genuine risk as the artifact count grows.
- **`VendorProposalFact`** (per the audit brief's exact shape) — the single biggest missing piece;
  without it, "governed evidence" for vendor responses is aspirational, not real.
- **`SourceStageContract`** — purpose, entry criteria, definition-of-done, prohibited content per
  stage, enforced at the stage-advancement route (which already exists,
  `evaluateSourceGateAdvanceContract`) but never checked against artifact generation itself.
- **`SourceWordBudget`** — target/advisory/blocking bands + `maxOutputTokens`, read by both
  `prompt-registry.ts`'s prompt-building code and `quality-review.ts`'s validator, closing the
  drift found in section D.

---

## G. Prioritized Roadmap

1. **Immediate integrity fixes** (small, high-leverage, low-risk):
   - Route the `artifacts/generate` (no-code) chat-save path through the same section/banned-term
     checks as the primary generate route, or remove/relabel it so it can't silently produce an
     unaudited "Source artifact."
   - Add `upstreamRequired: ["d16_scorecard", "d19_pricing_workbook"]` (or an explicit, disclosed
     decision not to) for `d24_decision_brief`.
   - Reconcile the `_legacy` artifact variants' word/token numbers or retire them explicitly.
2. **Artifact and prompt corrections**: build the shared `SourceArtifactContract`/`SourceWordBudget`
   types described in F; migrate `prompt-registry.ts`'s prose limits to read from them.
3. **Evidence-ingestion modernization**: the `VendorProposalFact` typed extraction pipeline, a real
   confidence-scoring pass (not fixed constants), a minimal human-review UI gating retrieval
   eligibility, and schema-aware XLSX parsing (formulas, merges, units). This is the largest, most
   consequential workstream in the whole audit.
4. **Visual and rendering system**: a `REF_*` visual-reference registry for document-generation
   exhibits (distinct from the already-live `AgentAnswerRenderer`/Recharts chat system), message-
   led title enforcement in prompts, and uniform governance-notice adoption across all renderer
   families.
5. **UX simplification**: keep the business-facing workflow (Prepare → Issue → Receive → Compare →
   Decide → Contract) simple while the audit trail underneath stays complete — largely a design
   task once 2-4 are real.
6. **Pipeline consolidation**: reconcile the three disconnected existing-contract-optimization
   engines into one, and de-hardcode the SkyHarbor-only eligibility check so the workflow is
   tenant-generic.

---

## H. Live Proof Plan

**Scenario 1 — new competitive sourcing event with three vendor proposals and a BAFO round.**
Use a real SkyHarbor event (this session already seeded one with real vendor-coverage and
committed-value facts: `SkyHarbor AMS Contract Optimization and Renewal Decision`,
`2e3e5152-017c-49f6-a2b6-83385907dfc4`) or a fresh event. Upload three distinct vendor proposal
PDFs, confirm (or disprove) whether any structured facts are actually extracted per the Evidence
Ingestion Audit's findings, generate d09→d16→d24 in sequence, and check whether the Decision Brief
can be produced before the scorecard exists (per the confirmed `upstreamRequired: []` gap).

**Scenario 2 — existing-contract optimization using MSA, SOW, invoices, SLA data, tickets, and
change orders.** Use a non-SkyHarbor tenant deliberately, to test whether
`isSkyHarborContractOptimizationEvent()`'s hard gate actually blocks the workflow for every other
client (a real, checkable prediction from this audit) — then attempt the same analysis via the
generic `CONTRACT_RENEWAL` archetype path to see whether it produces anything real or is genuinely
inert metadata as this audit found.

For each scenario, prove upload/parsing, fact extraction (or its honest absence), human review (or
its honest absence), evaluation-packet assembly, evidence-backed scoring, executive storytelling,
visual rendering, quality validation, approval, export, and audit lineage — following exactly the
runtime path traced in section A.

---

## I. Differentiated Client Value — the Delta Procurement Demo Vision

Everything above is the *foundation* track: closing integrity gaps, then building governed
proposal parsing, contracts, and rendering. That work is necessary but invisible to a buyer. This
section records the *parallel, client-facing* track it should be sequenced against — what Delta
procurement should actually experience once the foundation is trustworthy. The goal is not "we
digitized an RFP"; it is "at every step, AbarVa turns procurement evidence into sharper commercial
insight, better negotiating leverage, and a defensible executive decision."

### I.1 The six-step Delta experience

| Step | What Delta sees | What AbarVa analyzes/persists | Superior insight produced |
|---|---|---|---|
| 1. Prepare | Guided sourcing strategy and requirements | Business outcomes, service baseline, incumbent facts, requirements, priorities, risks, evaluation criteria | Best route to market, critical requirements, negotiation hypotheses, likely leverage points |
| 2. Issue | Controlled RFP and bidder workspace | Versioned requirements, bidder Q&A, addenda, response obligations | Requirement ambiguity, market-attractiveness risk, likely price-premium drivers |
| 3. Receive | Clear status of each proposal and missing responses | Original files, parsed responses, pricing rows, commitments, assumptions, exceptions, dependencies, provenance | Completeness, hidden qualifications, inconsistencies, comparison readiness |
| 4. Compare | Executive comparison with drill-down evidence | Normalized facts, weighted scores, price scenarios, risks, commitments, confidence | True differentiators, unsupported claims, apparent vs. real price advantage, risk-adjusted economics |
| 5. Negotiate/BAFO | Negotiation cockpit and scenario options | Baseline offer, target position, walk-away conditions, concessions, BAFO deltas, decision impact | Where Delta has leverage, what to trade, expected value per ask |
| 6. Decide/contract | Decision brief with conditions and transition view | Recommendation lineage, approvals, negotiated commitments, final pricing, obligations, conditions | Defensible award decision, preserved negotiation gains, contract controls that survive into delivery |

The "wow" comes from **accumulating intelligence across these six steps**, not regenerating
isolated documents at each one — this is the same principle as the `VendorProposalFact`/lineage
model already recommended in Section F, extended forward to negotiation and decision content.

### I.2 What must persist at every stage

Beyond `VendorProposalFact` (Section F), the full vision needs typed, lineage-backed persistence
for: **sourcing context** (objectives, scope, incumbent position, spend baseline, risk appetite,
evaluation priorities); **requirements** (stable ID, family, criticality, rationale, evidence
source, scoring rule, knockout status, clarification/version history); **commercial intelligence**
(proposal → clarified → BAFO version chain, one-time/recurring costs, volume tiers,
inflation/escalation, discounts, pass-throughs, normalization decisions); and — the piece with no
present analog anywhere in Source — **negotiation intelligence** (Delta target, vendor opening
position, benchmark range, leverage rationale, must-have vs. tradeable, walk-away condition,
planned ask, concession given/received, net economic and contract-language impact, approval/owner).
This last category is a genuinely new persistence model, not an extension of anything audited in
Sections A-E; it becomes Source's reusable **negotiation memory**, not a one-time spreadsheet.

### I.3 Pricing analytics that differentiate from a conventional RFP tool

Four capabilities, all downstream of the pricing-workbook parsing gap already flagged in Section E:
1. **True like-for-like cost** — normalize across vendors for scope, volume, term, currency,
   inflation, location mix, productivity assumptions, transition cost, tooling, consumption, risk
   contingency. Show submitted price → normalized price → risk-adjusted price → negotiated target
   → expected total economics as distinct, evidenced views (a vendor with the lowest submitted
   price may not have the lowest true economic cost — this is the headline executive message the
   whole normalization pipeline exists to support).
2. **Price-driver decomposition** — explain *why* a proposal costs what it costs (labor volume,
   rate, onshore/offshore mix, tooling, transition, consumption, risk premium), so the executive
   message can be specific ("Vendor A appears 8% cheaper on submitted price, but the advantage
   disappears after normalizing transition exclusions...") rather than generic.
3. **Scenario analytics** — base/higher-volume/lower-volume/slower-transition/inflation/
   consumption-growth/service-credit/early-termination cases, showing which vendor stays
   attractive as assumptions change.
4. **Commercial-outlier detection** — automatic flags for off-market rates, missing price
   elements, hidden pass-throughs, front-loaded transition fees, aggressive inflation clauses, weak
   service-credit regimes, exclusions likely to become change orders.

None of this is buildable before Section E's proposal/pricing-workbook parsing gap closes — this
is exactly why the foundation track is sequenced first, not a competing priority.

### I.4 Industry insight, with honest provenance

Reference patterns are valuable only if their source is never ambiguous. Every insight AbarVa
surfaces must be labeled as one of: **Delta evidence**, **vendor-submitted evidence**, **AbarVa
reference pattern**, **externally sourced benchmark**, or **directional advisory judgment** — never
presented as an unqualified "industry standard is..." claim. Each should carry why it's relevant,
its source/reference-library version, applicable conditions, confidence, and its impact on
evaluation or negotiation. Building a governed procurement reference library (rate-card ranges by
role/geography/tower, typical transition-fee structures, benchmark SLA ranges, observed negotiation
lever effectiveness, etc.) is real, valuable follow-on work — but it must be anonymized/aggregated
with clear provenance and must never expose another client's confidential data, matching this
repo's existing tenant-isolation discipline (Section E) applied to a new artifact class.

### I.5 The negotiation cockpit

Likely the single most visually compelling surface in the whole vision: an executive header
(submitted/normalized TCV, Delta target, latest vendor position, remaining opportunity, commercial
risk level, negotiation readiness) over a lever table (lever, vendor position, Delta target,
rationale, estimated impact, priority, status) and a scenario panel (best-likely / expected /
walk-away / tradeable / non-tradeable / decision-required-today). Critically, every lever's
evidence must drill down to its actual source — proposal clause, pricing-workbook cell,
clarification response, reference pattern, internal constraint, approval history — which only
works once the `VendorProposalFact` lineage model (Section F) is real. This is not a new UI
pattern to invent; it is the payoff of the evidence spine, rendered.

### I.6 Continuous, stage-specific insight generation

Rather than one large report at the end, Source should surface a small number of high-value
insights *as they become knowable* at each stage — e.g. during Strategy: "current scope may be too
broad for comparable bidding"; during RFP authoring: "this requirement cannot be scored
objectively"; during proposal intake: "commitment is weaker than the marketing language around
it"; during evaluation: "the low price depends on an aggressive assumption"; during negotiation:
"this concession appears valuable but has limited economic effect"; during decision: "the
recommendation only holds under a named assumption — flag it as a condition, not a certainty."
Each of these is a natural extension of the governed chat-answer pattern already proven this
session (vendor-coverage, value-waterfall, artifact-quality) — the same `AvaAnswerPacket` +
governance-gate mechanism, applied to new, stage-specific questions, not a new architecture.

### I.7 The demo narrative arc

A single end-to-end story, not a feature tour: **(1)** "we understand the need" — sourcing
strategy and market-approach rationale; **(2)** "we make the RFP decision-ready" — requirement
quality and traceability; **(3)** "we read every proposal deeply" — open one proposal, show
extracted commitments/exceptions/pricing/evidence/confidence/review-status live; **(4)** "we
compare what vendors actually mean, not just what they wrote" — normalized compliance, pricing,
risk; **(5)** "we identify negotiation leverage" — three to five concrete, evidenced levers;
**(6)** "we preserve every decision" — the offer→BAFO→negotiated-outcome evolution with approvals
and lineage; **(7)** "we produce the executive decision" — a concise, evidence-backed brief with
conditions and fallback. Closing message: *AbarVa does not just manage the sourcing workflow. It
creates a governed intelligence layer across requirements, supplier commitments, pricing, risk,
and negotiation — so Delta makes a stronger decision and retains the intelligence after the event
ends.*

### I.8 Two parallel tracks, one sequencing rule

| Foundation (Sections D/E/G, PRs 2-4) | Differentiated client value (this section, PR 5+) |
|---|---|
| Governed proposal parsing | Deep proposal intelligence |
| Structured facts and lineage | Evidence-backed comparison |
| Pricing normalization | True economic view |
| Quality and approval gates | Defensible decision |
| Persistent negotiation facts | Reusable negotiation memory |
| Reference-pattern governance | Industry and commercial insight |
| Stage contracts | Timely insights at every sourcing step |
| Executive story and visuals | C-suite-ready recommendation |

The rule this table encodes: **the security and integrity work comes first, underneath** — nothing
in this section is buildable, honestly, on top of a regex line-matcher with hardcoded confidence
scores and no review gate. But the product vision actually shown to Delta should be the analytics,
negotiation intelligence, and executive clarity that *trustworthy* evidence makes possible — the
foundation track exists to earn the right to build this section, not to replace it.

---

## Governing Standard

Per the audit brief: *"Can Source take an executive from a sourcing need, through governed
supplier evidence, to a clear and defensible decision — with every conclusion traceable, every
artifact purposeful, and every step simple for the user?"*

Current honest answer: **not yet, for the supplier-evidence leg specifically.** The lifecycle
scaffolding, stage-gate mechanics, artifact registry, and governed chat-answer layer (vendor-
coverage, value-waterfall, artifact-quality — all built and live-proven this session) are real and
substantially further along than a first read of the UI would suggest. The gap is concentrated in
one place: turning an uploaded vendor proposal into a structured, confidence-scored, human-
reviewable fact that a downstream decision can honestly cite. That is the workstream this audit
recommends prioritizing first — not because the Delta-facing vision in Section I doesn't matter,
but because every part of it is a direct function of that evidence spine being trustworthy first.
