# C2 · Intelligence Suite Detail Pages · 9 Products

**One page per Intelligence Suite product. The marketing depth behind each tile on the homepage. Where a prospective customer or investor clicks from C1 to understand a specific intelligence in detail. Also where logged-in users conceptually anchor "what does this part of the platform do."**

**April 21, 2026 · Wave 3 · For Codex execution**

Reads alongside:
- `c1-homepage-rewrite.md` — the homepage that links into these pages
- Per-tenant intelligence layer overlays — concrete examples these pages reference

---

## Part 1 · What these pages are

### 1.1 · Nine pages, one template

Each of the 9 Intelligence Suite products gets a dedicated page. Same template structure; content differs per product. The 9 pages are:

1. **Situation Intelligence** · `/platform/situation-intelligence`
2. **Strategy Intelligence** · `/platform/strategy-intelligence`
3. **Value Intelligence** · `/platform/value-intelligence`
4. **Commitment Intelligence** · `/platform/commitment-intelligence`
5. **Execution Intelligence** · `/platform/execution-intelligence`
6. **Outcome Intelligence** · `/platform/outcome-intelligence`
7. **Memory Intelligence** · `/platform/memory-intelligence`
8. **Pattern Intelligence** · `/platform/pattern-intelligence`
9. **Decision Intelligence** · `/platform/decision-intelligence`

### 1.2 · The reader

Someone who clicked from the homepage. They want to understand one specific intelligence at depth — what problem it solves, how it works, what the output feels like, why it matters.

This is where the positioning earns its keep with concrete specificity. Not "AI-powered strategy" but *"when strategy isn't matching capital allocation, we surface the contradiction with evidence and who needs to see it."*

---

## Part 2 · Shared template structure

Every Intelligence Suite detail page uses the same sections in the same order. Content differs; structure stays fixed. This makes the 9 pages feel like a coherent suite while reading each as its own artifact.

### 2.1 · Section 1 · Nav and breadcrumb

- Same marketing nav as C1 homepage
- Breadcrumb below: `Platform / [Product Name]`

### 2.2 · Section 2 · Hero

- Eyebrow (JetBrains Mono 11px teal): the Intelligence Name (e.g., "SITUATION INTELLIGENCE")
- Headline (Georgia 40-52px white, tight line-height): the CXO Question as headline
  - *"What's actually broken — and what's it costing us?"*
- Product name (DM Sans 16-18px 600 teal uppercase): the canonical product name
- Tagline (DM Sans 18-20px warm off-white, max-width 640px): a one-paragraph framing
- CTA row: "See it in action" (primary) · "Read the architecture" (secondary)

### 2.3 · Section 3 · The problem we solve

Editorial prose paragraph (DM Sans 16-17px warm off-white, line-height 1.7, max-width 720px).

Structure: what goes wrong in the current world, why existing tools don't solve it, what specifically is broken.

### 2.4 · Section 4 · How this intelligence works

Three-step breakdown. Each step:
- Step number (JetBrains Mono 11px teal)
- Step name (Georgia 22-24px white)
- Brief description (DM Sans 14-15px warm off-white, 2-3 sentences)

### 2.5 · Section 5 · What the output feels like

The most important section. Shows an actual output artifact — as close to real as we can get without naming a real customer. Anonymized composite.

Examples:
- For Situation Intelligence: a sample situation report with KPI drift, root cause hypothesis, and cost quantification
- For Pattern Intelligence: an anonymized pattern detection with evidence chain
- For Decision Intelligence: a sample decision brief with options, tradeoffs, and contradiction flags

Render the example in the actual product style — warm off-white on dark card, typography matching the real product.

### 2.6 · Section 6 · Integration with the rest of the suite

How this intelligence uses and is used by the other 8. Each connection as a small card:
- Intelligence name
- One-line description of the connection

This reinforces compound value — no intelligence works alone.

### 2.7 · Section 7 · CXO-grade proof points

Three concrete demonstrations of depth:
- Evidence handling (e.g., "Every claim traced to source — document, interview, telemetry record")
- Reasoning transparency (e.g., "Confidence notation where data is sparse; explicit when we're inferring")
- Action grounding (e.g., "Not advice — recommended action tied to the specific executive who can move it")

### 2.8 · Section 8 · Closing CTA

- "See it in your context" → design partner conversation request
- "Read more about the platform" → back to homepage or to architecture deep-dive

### 2.9 · Section 9 · Footer

Same as C1 homepage.

---

## Part 3 · Per-product content · key details for each page

### 3.1 · Situation Intelligence

- **CXO Question:** *"What's actually broken — and what's it costing us?"*
- **Problem:** Executives don't have a current, grounded view of operational reality. Dashboards show metrics; they don't show why metrics are drifting, what it's costing, or which root causes are actionable.
- **How it works:**
  1. Ingests operational telemetry, financial, and customer signals
  2. Detects drift, anomalies, and quiet deterioration
  3. Quantifies cost and attributes to root cause
- **Output example:** Situation report showing [KPI] drift, [N] contributing factors, quantified cost-of-inaction, and the executive closest to the problem.
- **Integration:** Feeds Strategy Intelligence with live ground truth. Feeds Commitment Intelligence with gaps.

### 3.2 · Strategy Intelligence

- **CXO Question:** *"What should we actually be doing?"*
- **Problem:** Strategic plans drift from reality. Priorities listed in slides don't connect to programs that exist, capital allocated, or executive attention spent. Strategy execution loses fidelity at every translation.
- **How it works:**
  1. Connects stated strategic priorities to concrete initiatives and capital
  2. Detects strategy-allocation contradictions
  3. Recommends re-anchoring actions with specific owners
- **Output example:** Strategic priority map showing priority → initiative → capital → ownership, with contradiction flags where misalignment exists.
- **Integration:** Reads Situation Intelligence for ground truth. Writes to Commitment Intelligence for stated commitments.

### 3.3 · Value Intelligence

- **CXO Question:** *"What's it actually worth doing?"*
- **Problem:** Organizations run dozens of initiatives without clear value hierarchy. Business cases were written at initiation; reality has since drifted. Value prioritization isn't happening.
- **How it works:**
  1. Maintains live value assessment across all initiatives
  2. Updates value expectations based on changing conditions
  3. Surfaces value leaks and opportunities
- **Output example:** Live value ranking of active initiatives, with explicit value assumptions and trigger conditions for reconsideration.
- **Integration:** Informs Decision Intelligence with value framing. Uses Outcome Intelligence for historical validation.

### 3.4 · Commitment Intelligence

- **CXO Question:** *"Are we actually doing what we said?"*
- **Problem:** Public commitments and internal commitments accumulate. Tracking slips. The gap between what executives said in earnings calls or board meetings and what's actually happening grows invisible.
- **How it works:**
  1. Captures stated commitments from meetings, calls, and planning artifacts
  2. Tracks progress against commitments
  3. Surfaces gap flags before they become public embarrassments
- **Output example:** Commitment dashboard showing each public commitment, progress trajectory, and gap projection with days-to-recovery math.
- **Integration:** Reads Situation Intelligence for ground truth. Signals Decision Intelligence when gaps require executive decision.

### 3.5 · Execution Intelligence

- **CXO Question:** *"Is this actually going to work?"*
- **Problem:** Programs run on optimism. Risk signals are noticed late. Executives ask for status and get confident green lights until the week before the red flag.
- **How it works:**
  1. Monitors execution signals — phase gate transitions, decision latency, stakeholder behavior
  2. Detects early-warning patterns from historical program intelligence
  3. Surfaces risk with evidence and recommendation
- **Output example:** Execution health view with leading indicators, peer-program comparisons, and pattern matches (e.g., "This resembles the pre-failure signature of [Pattern X]").
- **Integration:** Uses Pattern Intelligence heavily. Feeds Decision Intelligence with intervention options.

### 3.6 · Outcome Intelligence

- **CXO Question:** *"Did it actually work?"*
- **Problem:** After programs end, outcome measurement is rarely honest. Success is declared; specifics fade. No compounding learning results.
- **How it works:**
  1. Baselines outcomes at program start with explicit hypotheses
  2. Measures outcome delivery against baseline with attribution
  3. Feeds learning into Pattern Intelligence and Memory Intelligence
- **Output example:** Outcome attribution analysis showing what was achieved, what wasn't, and why — with confidence notation where attribution is genuinely ambiguous.
- **Integration:** Writes to Pattern Intelligence and Memory Intelligence. Reads Value Intelligence for initial hypothesis.

### 3.7 · Memory Intelligence

- **CXO Question:** *"What have we actually learned?"*
- **Problem:** Organizational memory is fragile. Executives turn over; lessons fade; the same mistakes recur. Institutional wisdom doesn't compound.
- **How it works:**
  1. Captures decisions, context, reasoning, and outcomes across time
  2. Preserves with full evidence and scope
  3. Surfaces relevant memory at decision moments
- **Output example:** Decision archive with full context — what was decided, by whom, why, what happened, what was learned.
- **Integration:** Reads Outcome Intelligence. Feeds Decision Intelligence with relevant precedent.

### 3.8 · Pattern Intelligence

- **CXO Question:** *"What's the pattern underneath this?"*
- **Problem:** Enterprises treat every situation as novel. Patterns exist across programs, across executives, across sectors — but they're not detected, not named, not reused.
- **How it works:**
  1. Maintains the Transformation Genome — structured anonymized patterns across programs
  2. Matches current situations against the Genome
  3. Surfaces pattern matches with confidence and intervention menu
- **Output example:** Pattern match card showing *"This situation resembles Shadow AI Governance pattern (73% confidence), typical failure mode X, typical intervention effectiveness Y."*
- **Integration:** Used by Execution, Decision, and Situation Intelligence. Reads Outcome Intelligence for pattern enrichment.

### 3.9 · Decision Intelligence

- **CXO Question:** *"What should we decide — and what are we missing?"*
- **Problem:** Executive decisions are made with incomplete framing. Options are narrowed early. Tradeoffs stay implicit. Blind spots remain blind. Decisions get re-litigated because the original framing was thin.
- **How it works:**
  1. Composes decision briefs with options, tradeoffs, evidence, precedent
  2. Surfaces contradictions and blind spots before decision is finalized
  3. Captures decision with full context for memory
- **Output example:** Decision brief showing the question, 3 genuine options, tradeoffs, evidence per option, precedent matches, open contradictions, recommendation with reasoning.
- **Integration:** Reads nearly every other intelligence. Writes to Memory Intelligence.

---

## Part 4 · Implementation specs

### 4.1 · Shared components

Build once, use across all 9 pages:
- ProductHero component (takes product metadata)
- ProblemParagraph component
- HowItWorksSteps component (3 steps)
- OutputExample component (card with sample output)
- IntegrationCards component (small cards for related intelligences)
- ProofPointCards component
- ClosingCTA component

### 4.2 · Content source

All 9 products defined in a single content file:

```typescript
// src/content/intelligence-suite.ts
export const intelligenceProducts = [
  {
    id: "situation",
    intelligenceName: "SITUATION INTELLIGENCE",
    productName: "Situation Intelligence",
    cxoQuestion: "What's actually broken — and what's it costing us?",
    tagline: "...",
    problem: "...",
    howItWorks: [...],
    outputExample: {...},
    integrations: [...],
    proofPoints: [...],
  },
  // ... 8 more
];
```

Single source feeds homepage product grid AND these detail pages.

### 4.3 · Routing

Dynamic route: `/platform/[product-slug]` with product-slug matching product IDs. Static generation at build time.

### 4.4 · Design system

Matches C1 and the rest of marketing surfaces. Same typography, same color discipline, same editorial character.

### 4.5 · Internal linking

- Each page links to related products in the Integration section
- Each page's CTA links back to homepage or to design partner contact
- Footer consistent across all pages

---

## Part 5 · Output example rendering

The most important section per page. Must feel like the real product output, not marketing illustration.

Guidelines:
- Render in the AbarVa visual language (dark card, warm off-white text, teal accents, JetBrains Mono labels)
- Use realistic content sourced from the composite tenant intelligence overlays
- Anonymize — never name a real customer; "a Fortune 500 retailer" or "a large regional health system" is the degree of specificity allowed
- Include evidence/confidence notation where appropriate — this is where AbarVa's intellectual seriousness shows

Codex can pull example content from the Keystone, Apex, Meridian, First Capital intelligence overlays, generically anonymized.

---

## Part 6 · Non-goals

- No live product demos embedded on these pages (separate demo surface)
- No customer testimonials (we don't have customers yet)
- No pricing on these pages (keep commercial conversation off marketing)
- No comparison tables vs competitors (we don't need to punch down)
- No feature lists (we show outputs, not feature checklists)

---

## Part 7 · Ingestion notes for Codex

### 7.1 · Template-first approach

Build the template and one exemplary product (Situation Intelligence) end-to-end. Then stamp out the other 8 with content variations. This ensures consistency and reduces rework.

### 7.2 · Content iteration

Expect Anand to iterate on copy for all 9 products. Make content updates trivial — single content file, no code changes needed.

### 7.3 · Cross-page consistency

Same design tokens, same component hierarchy, same footer across all 9. Easy to maintain if they diverge.

### 7.4 · SEO

Each page has specific metadata and structured data. Target phrases like "enterprise transformation strategy intelligence" where each product owns a specific SEO niche within the broader category.

---

**END C2 · INTELLIGENCE SUITE DETAIL PAGES**

*9 pages, one template, compound proof. Where each intelligence earns its positioning in concrete detail.*
