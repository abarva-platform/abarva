# The Brain Contract

**Status:** v1 · 2026-06-22
**Source of truth:** the architecture promised in `docs/build/ABARVA_HOW_THE_BRAIN_WORKS.html`.
**Surface doctrine:** `docs/product/HOME_INTELLIGENCE_SURFACE_DOCTRINE.md`.
**Purpose:** turn that doc's promises into explicit, machine-checkable invariants so we can
test whether the product *actually instantiates the brain* — not whether the UI merely renders.
This file is the **acceptance test and the anti-flip-back anchor**: changing an invariant
requires changing this doc *and* the gate that enforces it, so no stale branch or rollup can
quietly revert the architecture.

---

## The boundary: architecture (gates) vs depth (tracked, not gating)

- **Must-be-true architecture** — invariants 1–7 below. These **gate**: if any is red for any
  tenant on the deployed app, the brain is not instantiated, and we do not stress-test.
- **Depth of corpus** — e.g. "≈210 virtual experts", the full 5-tier substrate breadth. These
  are **tracked as a coverage metric, not a pass/fail gate.** A thin-but-correct faculty still
  conforms; we report depth separately so we never fail the conformance test on roadmap.

## Surface posture boundary

The product has two different ask postures:

- **Home / Explorer answers "what do we know?"** It is the evidence room. It returns loaded
  facts, dimensions, gaps, conflicts, simple source-owned tables/charts/graphs, and citations.
  It does not summon experts or write strategy recommendations.
- **Intelligence answers "what does it mean?"** It is the advisor layer. It combines the same
  tenant facts with governed corpus, benchmarks, ExpertPacks, patterns, and reasoning. It must
  label tenant fact versus pattern, benchmark, inference, and gap.

The detailed doctrine is `docs/product/HOME_INTELLIGENCE_SURFACE_DOCTRINE.md`. Any
implementation that makes Home behave like Intelligence, or makes Intelligence bypass the
loaded evidence layer, violates this contract.

---

## The seven invariants

Each is: the brain-doc promise → the invariant that must hold → the **one** canonical owner →
how it is proven (a `tenant-matrix-gate` column and/or a signed-in browser-crawl step).

### 1 · Substrate knows the tenant
- **Promise:** the substrate turns the tenant's data into one decision-ready dataset.
- **Invariant:** there is **one canonical per-tenant dimension/context source** (the v4
  read-model), and **every surface binds it identically**. The rendered dimension count
  **equals the canonical count** — not an 8-bucket rollup, not a 19-item demo blob.
- **Canonical owner:** the v4 read-model (manifest/DB), exposed by a single binding function.
  Retire/redirect: `all-tenants.json` 8-dim rollup, `public/home-v2` 19-dim demo,
  per-surface readers (`tower-v2/v4-data.ts`, `home/enterprise-landscape-view-model.ts`).
- **Proof:** gate column `dims19` (canonical dim count on `/home` **and** `/intelligence`) + a CI
  gate that fails on divergence. Browser: the Home rail shows the full dimension set per tenant.

### 2 · Context is retrievable
- **Promise:** facts are retrievable and cited the instant you ask.
- **Invariant:** a tenant-fact question returns an answer **grounded in tenant facts and cited**;
  it **never** says "context not loaded / not in this session" when the tenant's pack has it.
- **Canonical owner:** the retrieval/read-model path (clean tenant resolution; the
  fact-availability guard counts v4 chunks as real evidence).
- **Proof:** gate column `grounded` (no not-loaded hedge; cites a `tenant-fact`). Browser: a
  signed-in "current state of X" answer names real systems/figures from the pack.

### 3 · One faculty / one engine
- **Promise:** one engine; the right Consilium expert summoned per question.
- **Invariant:** every surface (Home, Intelligence, Tower, Source, Moves) routes the **same ask
  contract** → one expert-summon → one `AgentAnswer`. No per-surface answer logic.
- **Canonical owner:** one server engine entry (`/api/intelligence/ask` → `summonExpertsForQuery`
  → `AgentAnswer`).
- **Proof:** gate column `experts` (named experts surface, correct domain) + a code assertion
  that each surface's ask routes the single engine entry.

### 4 · One aVa voice
- **Promise:** one voice across every surface; not screen-by-screen.
- **Invariant:** input, conversation history, and answer rendering are **shared components**
  used identically by Home/Intelligence/Tower. Multi-line input; a persisted conversation
  thread (not single-shot); same persona/kicker.
- **Canonical owner:** one ask component (`AvaAsk`) + one renderer (`AgentAnswerRenderer`).
- **Proof:** gate column `readable` (consultant-readable, multi-paragraph answer) + the gate's
  browser context exercises multi-line input + a persisted thread + a code assertion that the
  three surfaces import the **same** input/history/renderer components, not forks.

### 5 · Prose + tables + charts + exhibits
- **Promise:** answers render as prose, tables, charts, graphs, or next actions per the question.
- **Invariant:** exhibits are **model-emitted, intentional, typed** (`AgentAnswer.tables/charts/
  graphs` with declared kind/labels/figures, validated by the quality gate) and rendered by the
  one renderer. **No prose-scraped exhibits** (that produced the fabricated $324M chart).
- **Canonical owner:** the `AgentAnswer` contract + `AgentAnswerRenderer`. Retire
  `structured-exhibits.ts` prose-scraping.
- **Proof:** gate column `visual` (a "show me a table/chart" question returns a **typed** exhibit
  and stays readable). Browser: the chart/table renders and the figures are right.

### 6 · A decision travels end to end
- **Promise:** one decision moves across all five surfaces on one spine — not re-entered per screen.
- **Invariant:** a decision/bet object is **referenceable across surfaces** (Context →
  Intelligence → Moves → Source → Tower) with continuity, not re-keyed.
- **Canonical owner:** the shared decision/evidence object on the spine.
- **Proof:** gate column `continuity` — **the one invariant the matrix does not yet cover; add
  it.** (Browser-crawl): originate a decision on one surface, find it referenced on the next.

### 7 · Tenant-fenced honesty
- **Promise:** honest by design; tenant-isolated.
- **Invariant:** no cross-tenant data leak; hedges when evidence is genuinely absent; never
  surfaces raw internal IDs.
- **Canonical owner:** the cross-tenant fence + the honesty/quality gates in the engine.
- **Proof:** gate columns `fence` + `noRawId`.

---

## Definition of done (conformance)

The brain is instantiated **only when the contract matrix is green for all five binding-backed
tenants on the deployed app** (apexretail, arcturus/First Capital, skyharbor, meridian, lakeshore):

```
tenant   render intel dims19 synthesis readable visual grounded noRawId experts fence   (+ continuity — to add)
```

- `scripts/qa/tenant-matrix-gate.mjs` (now Playwright/browser-driven) proves these columns over
  the deployed app, per tenant — including the DOM-level ones (`readable`, `visual`).
- **`continuity` (invariant 6) is the one column not yet in the matrix** — add it next.
- That gate is the **canonical proof harness**: extend the existing file — do **not** fork a
  parallel gate (forking is how the flip-back happens). Its columns *are* the contract.

Only when this is fully green do we start the **100-tough-question stress test**. Stress-testing
a non-conformant brain produces noise, not signal.

## Change control

This contract is versioned. To change an invariant: update this file, update the gate column,
and note it in the PR. Two paths computing the same canonical value is itself a contract
violation (it is how the flip-back happens) — collapse to one owner.
