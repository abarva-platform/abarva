# Home / Explorer and Intelligence Product Doctrine

**Status:** v1 · 2026-06-24  
**Purpose:** lock the product boundary between Home / Explorer and Intelligence so the app does not drift back into duplicate chat surfaces, mixed answer logic, or strategy prose inside the evidence browser.

This doctrine is a product contract. It is not a design suggestion. Any implementation that makes Home behave like Intelligence, or makes Intelligence bypass the loaded evidence layer, violates the contract.

---

## North Star

**Home proves what is loaded. Intelligence explains what it means. Moves turns it into action. Tower proves whether it worked. Source helps buy, build, or partner.**

Home and Intelligence must share the same underlying enterprise context, tenant fence, citations, and semantic layer. They must not share the same answer posture.

---

## Surface Responsibilities

| Surface | Primary Job | User Question | Required Behavior | Must Not Do |
|---|---|---|---|---|
| Home / Explorer | Know | What do we know? | Return loaded facts, dimensions, source coverage, gaps, conflicts, simple tables/charts, citations. | Invent strategy, summon experts, over-answer, recommend a decision. |
| Intelligence | Analyze | What does it mean? | Reason over tenant facts plus industry corpus, benchmarks, expert packs, and patterns. Separate fact from interpretation. | Pretend pattern-only content is tenant fact, hide missing evidence, bypass citations. |
| Moves | Act | What should we do now? | Convert a decision into an execution packet, owners, phases, risks, and measurable outcomes. | Become a generic evidence browser. |
| Source | Source | Which vendor / partner / commercial path and why? | Run sourcing, vendor, market, pricing, and negotiation intelligence. | Be general enterprise Q&A. |
| Tower | Prove | Are we delivering value and controlling risk? | Track value, delivery, risk, controls, gates, and operating proof. | Be discovery browsing or free-form consulting. |

---

## Home / Explorer Contract

Home is the trusted enterprise memory and evidence explorer.

Home answers only from loaded client context and deterministic read models. It can use templates and deterministic formatting, but it must not rely on expert inference to fill missing evidence.

Home should answer:

- What data is loaded for this client?
- What systems, vendors, initiatives, owners, budgets, risks, controls, capabilities, metrics, and data products do we know?
- Which sources support this answer?
- Which fields are missing?
- Show applications owned by Finance.
- Table vendors by category.
- Chart known budget by category when the loaded data supports it.
- Show loaded relationships when edge pairs exist.

Home answer basis labels:

- `tenant_fact`
- `source_coverage`
- `gap`
- `conflict`
- `simple_derived_metric`

Home handoff rule:

If a question asks for prioritization, recommendation, investment allocation, kill / scale / hold, transformation strategy, board advice, or a what-should-we-do decision, Home must return a handoff. It may also offer to show loaded facts first.

Required Home response shape:

- short factual prose
- citations
- dimensions used
- deterministic tables / charts / graphs only when source data supports them
- explicit gaps when fields or joins are missing
- handoff card when the question is outside KNOW mode

Forbidden in Home:

- contributing experts
- DORA / productivity / Wave / kill-criteria templates unless literally loaded and directly requested
- strategy recommendation language for lookup questions
- raw IDs in prose
- broad "not loaded" hedges when related data exists
- local environment or internal path language

---

## Intelligence Contract

Intelligence is the advisor layer.

Intelligence uses the same tenant substrate as Home, then adds the governed industry corpus, expert packs, patterns, benchmarks, and reasoning. It should feel like a senior consultant who can interpret the evidence, challenge assumptions, and frame options.

Intelligence should answer:

- Which AI investments should we scale, hold, or kill?
- What is the real risk in this modernization portfolio?
- How does this compare to airline, retail, healthcare, banking, industrial, or cross-industry patterns?
- What are the tradeoffs, scenarios, and next decisions?
- What should the CIO, CDO, CFO, COO, or board consider next?

Intelligence answer basis labels:

- `tenant_fact`
- `industry_pattern`
- `benchmark`
- `expert_inference`
- `scenario`
- `gap`

Required Intelligence response shape:

- consultant-readable answer, not a dense paragraph
- explicit thesis / evidence / implication / next decision structure when appropriate
- tenant-specific claims cited to tenant facts
- pattern-only claims labeled as pattern-only
- contributing experts surfaced when used
- typed tables / charts / graphs when the question asks for them and data supports them
- gaps and confidence stated plainly

Forbidden in Intelligence:

- unsupported tenant-specific claims
- unlabeled pattern-only advice
- fake charts or arithmetic from unrelated figures
- cross-tenant leakage
- raw IDs in executive prose

---

## Handoff Examples

### Home question

> Where should we invest $30M?

Home should not answer the strategy. Home should return:

- `answerStatus: handoff`
- target: Intelligence or Moves
- explanation: this is a decision / prioritization question
- optional action: show loaded facts first

### Intelligence question

> Where should we invest $30M?

Intelligence should answer with:

- tenant facts that bound the decision
- industry patterns and benchmark context
- options and tradeoffs
- risks and missing evidence
- recommendation framing or decision criteria
- citations and expert trace

---

## Implementation Rules

1. One tenant resolver.
2. One semantic question layer.
3. One canonical evidence/citation contract.
4. Home has a KNOW-mode response contract.
5. Intelligence has an ADVISE/DECIDE response contract.
6. Both surfaces use the shared chat/thread/renderer primitives where the UX is common.
7. The backend owns intent classification and answer shape. Frontend must not infer the response mode.
8. Progress must be tracked in `docs/build/BRAIN_CONTRACT_PROGRESS.md` with phase/category percent visible at the top.

---

## Proof Standard

A slice is not complete because code merged. Use separate proof states:

- authored / designed
- implemented in code
- merged to main
- deployed to ACA
- live API-proven
- browser-proven for all five tenants
- reality-crawl-proven

A progress percentage may only move when the relevant proof state moves.
