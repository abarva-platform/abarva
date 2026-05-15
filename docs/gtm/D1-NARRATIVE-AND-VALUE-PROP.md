# AbarVa · Product Narrative + Value Proposition

> Locked language. Owner: founder. Last updated 2026-05-14. Every surface (sign-in, marketing site, deck, README, sales conversation) uses these phrasings verbatim until the next refresh cycle.

---

## The one-line

> **AbarVa is the tenant-grounded decision OS for the C-suite — the layer that turns AI and business bets into auditable, evidence-backed moves.**

Use this exact line anywhere we have one line. Don't paraphrase.

---

## The two-line

> AbarVa is the tenant-grounded decision OS for the C-suite. Every AI and business bet runs through a per-tenant context substrate, a consultant-grade reasoning layer, and an audit-traceable evidence ledger — so the CEO, CFO, COO, and CDO get the same rigor a $5M consulting engagement would produce, at SaaS economics, with their own data control.

Use this in cover slides, deck slide 1, email-outbound openers, the sign-in tagline.

---

## The 90-second pitch

Every C-suite is being asked to make AI bets without the substrate that would make those bets defensible. Consultants ship slideware and leave. LLM wrappers do search but not decision. Internal builds die when the sponsor changes jobs. Meanwhile the average Fortune 500 is committing $50–200M a year against AI initiatives whose business case lives in spreadsheets and three named champions' heads.

AbarVa is the working decision OS that fixes this. Every customer gets a private context substrate — their org chart, their KPIs, their vendor and contract registry, their initiative portfolio, their incident and operating telemetry — that grounds every agent answer. Four product surfaces (Intelligence, Moves, Source, Tower) each fronted by a named agent (Sentinel, Nexus, Atlas, Steward) take a CXO from "what does the pattern say" to "which bet do we move" to "did the bet land." Every answer cites the underlying evidence chunk. Every decision is auditable. Every tenant's data stays in their data plane.

We're not selling AI. We're selling the substrate that makes AI decisions land.

---

## The five proof points

1. **Tenant-grounded by construction.** Every agent answer is bound to the caller's tenant via the `AgentContextBroker` contract. No URL-controlled tenant rebinding (audit PR #1930). No cross-tenant leakage (PRs #1923–#1933 closed all SEC-P0 routes). PHI/PII rejected before storage on 7/7 upload routes (PR #1941). Verifiable, not promised.

2. **Working product across three industries.** Three reference deployments live today — Apex Retail ($18B omnichannel), Meridian Health ($14.2B IDN), First Capital Financial ($28B regional bank). Each renders 15 coverage-by-domain tiles + 6 synthesized context cards from a 14-segment data pack. Not a demo with mocked data; a real broker substrate that a sec team can inspect.

3. **Consultant-grade output, not consultant-style.** Sentinel produces specific numbers, named risks, named owners, and binding pattern citations — see the `audit-2026-05-13` arc for examples where Sentinel correctly named the CFO, identified a $107M annualized vendor-spend cluster, and recommended a 60-minute decision-rights session with named executives. Arithmetic guard catches its own self-corrections (PR #1932).

4. **Enterprise infrastructure, not toy infrastructure.** Azure-native private data plane in progress (#1938 Container Apps + #1940 private Postgres in eastus2, both private-endpoint-only). Three-lane architecture (Control / Private Data / Intelligence-Model). Client-VPC deployment SKU planned for regulated customers. SOC2 readiness roadmap published in `docs/security/INFOSEC-ACCELERATOR.md`.

5. **Audit-traceable evidence.** Every Sentinel answer cites the underlying chunk. Every decision links to the program, the move, and the original source artifact. Every upload is logged. Every cross-tenant attempt is logged. A customer's auditor reads our trail without negotiating access to a black box.

---

## The category framing

AbarVa is a **decision OS**, not an AI assistant.

- An AI assistant answers questions. A decision OS captures the move you make from the answer.
- An LLM wrapper takes prompts and returns text. A decision OS holds the substrate of your enterprise.
- A consulting firm produces a deck. A decision OS produces a queryable, auditable corpus that survives the next leadership transition.

This framing matters because it changes who buys it (CEO/CFO/COO/CDO, not the head of AI), the unit of value (decisions made, not queries served), and the buying motion (annual contract anchored on outcomes, not seat licenses anchored on usage).

---

## Audience-specific cuts

### CEO
> "AbarVa makes your AI portfolio defensible. Every bet has a value-at-stake number, a binding pattern that proves it's not a one-off, and an owner accountable for outcome. Your board reads the brief in 10 minutes and asks the right questions."

### CFO
> "AbarVa is the substrate that turns AI spend into auditable line items. Every initiative has a value posture (captured / blocked / candidate), a vendor-renewal calendar tied to contract terms, and an evidence trail your auditor can walk. No more $200M committed against a slide deck."

### COO / CDO
> "AbarVa is the operating layer that turns scattered AI experiments into a portfolio with phase gates, decision rights, and outcome telemetry. Atlas watches drift; Nexus shapes moves; Sentinel surfaces what the corpus says; Steward keeps the substrate honest."

### Head of AI / CIO
> "AbarVa is the per-tenant context layer your team should be building but doesn't have the bandwidth to build right. We ground your custom AI work in your enterprise's actual data. We don't compete with your stack — we make it decision-grade."

### Sec architect
> "AbarVa was built tenant-isolated from day one. Private data plane per customer. PHI/PII rejected at ingest by design. 33-row pre-filled CAIQ-Lite at `docs/security/INFOSEC-ACCELERATOR.md`. Client-VPC deployment available. SOC2 roadmap published."

---

## Anti-positioning (what we are *not*)

- We are not Glean or another enterprise search product. Search retrieves; we decide.
- We are not LangChain or AI tooling. We don't sell to AI builders; we sell to the C-suite.
- We are not Palantir Foundry. We're per-tenant, lower-friction, and Anthropic-grade reasoning — not a multi-year platform engagement.
- We are not a McKinsey QuantumBlack replacement; we're what the consultant *should have* shipped at the end of the engagement.
- We are not a vertical agent for one industry. The substrate is industry-agnostic; the demo content is industry-specific.

---

## The four-surface frame (use in every deep dive)

| Surface | Agent | What it answers | Who reads it most |
|---|---|---|---|
| **Intelligence** | Sentinel | "What does the pattern + the corpus say I should do?" | CEO, CFO, CDO |
| **Moves** (Strategic Moves) | Nexus | "Take this signal and shape it into a phase-gated decision." | COO, CDO, Head of Strategy |
| **Source** (Sourcing) | Atlas / Sentinel | "Run the vendor decision with evidence at every gate." | CIO, CPO, CFO |
| **Tower** (Portfolio Cockpit) | Atlas | "Watch the portfolio; flag drift; brief the board." | CFO, COO, CIO |

Always use these four together. Don't talk about Intelligence in isolation — the whole point is the loop from Pattern → Move → Source → Outcome.

---

## Words to use

- **Substrate.** Not "knowledge base." Not "data lake."
- **Tenant-grounded.** Not "personalized." Not "context-aware."
- **Evidence-backed.** Not "AI-powered."
- **Decision OS.** Not "platform." Not "assistant."
- **Audit-traceable.** Not "transparent."
- **Pattern-bound move.** Not "recommendation."

## Words to avoid

- "AI-powered" (everything is AI-powered now; it's noise)
- "Revolutionary" / "transformative" / "next-generation" (any VC-deck cliché)
- "Insights" without an attached number, owner, or evidence chunk
- "Co-pilot" (we're not a sidecar; we're the operating layer)
- "Enterprise-grade" without naming the specific control

---

## When to refresh this doc

Refresh after:
1. Two or more CXO conversations where the language doesn't land as intended.
2. A material change in the product (e.g., a fifth surface).
3. A material change in the customer profile (e.g., we start selling to a different tier).
4. Before any major investor outreach window.

Keep the file dated. Don't edit silently — re-version (`D1-NARRATIVE-2026-08-XX.md`) so the historical anchor is preserved.

---

## Companion artifacts

- `docs/gtm/D2-MONETIZATION-TIERS.md` — pricing tiers + inclusion matrix (D2)
- `docs/gtm/D6-SEED-FUNDING-PLAN.md` — investor narrative + ask + deck outline (D6)
- `docs/security/INFOSEC-ACCELERATOR.md` — CISO-facing CAIQ (C4)
- `docs/BACKLOG-2026-05-14.md` — strategic roadmap
- `audit-2026-05-13/CYCLE_SUMMARY.md` — engineering rigor proof-point
