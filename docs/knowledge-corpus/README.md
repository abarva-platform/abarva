# Knowledge Corpus Package

**Version:** 1.1.0 · locked 2026-05-08 (v1.1 extensions added)
**v1.0 base schema:** locked 2026-05-08 (5 entities · agent contracts · provenance · cross-references · tenant overlay · curation pipeline)
**v1.1 extensions:** see `SCHEMA_EXTENSIONS_V1_1.md` — adds Proof Point · Persona · Move Cascade · Anti-Pattern entities + lifecycle / share-trajectory / quantified-signal fields. Strictly additive to v1.0.
**Industries (parity):** retail · healthcare · financial services (curation prompts for all three)
**Outcome:** Architecture + curation prompts for the cross-surface knowledge corpus that powers Intelligence, Source, and Moves agents. Schema locked. Three industries ready for population via the included curation prompts.

---

## What this is

The shared substrate of industry knowledge that three AbarVa agents read from:

- **Sentinel** (on Intelligence) — uses the corpus to surface use cases, patterns, candidate Moves
- **Source** (or whatever the Source agent ends up named) — uses vendor + SI subsections to support sourcing decisions
- **Nexus** (on Moves originate) — uses pattern subsection during Move shaping

Three agents, one corpus, structured access. The corpus is what makes Intelligence "shine" — it's the depth that turns generic synthesis into industry-specific bet-shaping intelligence.

---

## Why this matters

Per the locked CIO bet-shaping thesis: AbarVa's job is to make sure the bets a CIO places are the right ones. That requires the platform to *know* the AI landscape in the CIO's industry — what use cases are real, what patterns succeed/fail, what vendors are credible, what SIs have practice, what regulatory context applies.

Without this corpus: agents respond from generic training knowledge. Castillo gets vanilla Claude on top of substrate. The platform's value drops to the level of any LLM-with-RAG.

With this corpus: agents respond with industry-grounded specificity. "For ambient AI clinical documentation in a 8-hospital health system, the success pattern requires CMIO sponsorship + primary care first; failed bets typically had CIO sponsorship alone + horizontal scaling." That's the depth the bet-shaping thesis requires.

---

## What's in this package

```
knowledge-corpus-package/
├── README.md                                       (this file)
├── master-prompt.md                                orchestration · execution order
├── KNOWLEDGE_CORPUS_SCHEMA.md                      canonical schema · use cases · patterns · vendors · SIs · regulatory
├── AGENT_QUERY_CONTRACTS.md                        how Sentinel/Source/Nexus read the corpus
├── PROVENANCE_AND_VERSIONING.md                    Three Tests gate applied to corpus content
├── CROSS_REFERENCE_GRAPH.md                        the relational structure of the corpus
├── TENANT_OVERLAY_LOGIC.md                         tenant-specific filtering and scoring
├── CURATION_PIPELINE.md                            v0 hand-curation · v1 AI-augmented · v2 customer-contributed
├── CURATION_PROMPT_RETAIL.md                       ★ executable prompt to populate retail substrate
├── CURATION_PROMPT_HEALTHCARE.md                   ★ executable prompt to populate healthcare substrate
├── AGENT_INTEGRATION_PROMPT.md                     ★ executable prompt to wire agents to corpus
└── claude-code-runbook.md                          orchestration prompt for Claude Code
```

★ The three asterisked files are **executable prompts** that drive population and integration. Hand them to Claude Code (or a research-augmented agent) to do the actual curation and wiring work.

---

## How to execute

This package is structured so the architecture work happens in this session (these files) and the heavy curation work happens via the included prompts in subsequent Claude Code sessions.

**Phase 1 — Architecture lands (this package):**
1. Read README.md (this file)
2. Read master-prompt.md
3. Read KNOWLEDGE_CORPUS_SCHEMA.md to understand the data model
4. Read AGENT_QUERY_CONTRACTS.md to understand how agents consume
5. Read PROVENANCE_AND_VERSIONING.md for discipline
6. Read CROSS_REFERENCE_GRAPH.md for relational structure
7. Read TENANT_OVERLAY_LOGIC.md for tenant-specific views
8. Read CURATION_PIPELINE.md for the populate model

These files commit to the repo as the binding architecture.

**Phase 2 — Schema migrations + agent contracts ship as PRs:**
- Add corpus tables / files per schema
- Update agent system prompts per query contracts
- Build curation tooling (the editing layer)

**Phase 3 — Population (executes via prompts):**
- Hand CURATION_PROMPT_RETAIL.md to Claude Code → produces ~22 retail use cases + patterns + vendors + SIs + regulatory
- Hand CURATION_PROMPT_HEALTHCARE.md to Claude Code → produces ~23 healthcare use cases + patterns + vendors + SIs + regulatory
- Each curation run produces structured JSON files committed to the corpus

**Phase 4 — Agent integration (executes via prompt):**
- Hand AGENT_INTEGRATION_PROMPT.md to Claude Code → wires Sentinel, Source, Nexus to the populated corpus

Total expected calendar: 1-2 weeks for full population + integration. The architecture (this package) is what enables that timeline.

---

## What this does NOT do

- Does NOT populate the corpus in this session. Population happens via the included prompts in dedicated curation runs.
- Does NOT cover financial services. Architecture supports it; population deferred to v2.
- Does NOT build the customer-contributed-signal layer. v2/v3 work after corpus is live.
- Does NOT modify existing surfaces (Intelligence / Source / Moves). Surface changes are downstream of agent integration.
- Does NOT change the substrate package (AI Initiatives Registry). The corpus is industry knowledge; substrate is tenant-specific reality. Different layers.

---

## What's downstream of this package

After this package + population + integration completes:

- **Intelligence** "shines" — knowledge layer renders use case browser, pattern library, regulatory updates; art of possible scores candidate Moves against tenant profile
- **Source** has actual vendor + SI intelligence to render (not stubbed cards)
- **Moves originate** — Nexus references success patterns during shaping; the Move starts smarter
- **Journey Kit** can probe corpus-grounded reasoning (probes get sharper)
- **Brand and value story** — the platform demonstrably knows the industry, which is the proof point CIOs actually need

---

## Doctrine constraints

1. **Corpus is shared, not per-surface.** One source of truth. Three agents read it. No duplication.

2. **Schema before population.** Architecture locks first. Population fills locked schema. No re-curating against shifting fields.

3. **Provenance on every claim.** Three Tests gate applies. Each entry: source, currency date, reliability rating. Agents cite provenance when surfacing claims.

4. **Real names, real specificity.** Vendor names are real (Nuance, Sierra, Epic, etc.). Use case names are specific (not generic categories). Patterns are concrete (not management aphorisms).

5. **Cross-referenced, not flat.** Use cases link patterns. Patterns link use cases. Vendors link use cases. SIs link vendors and use cases. The corpus is a graph.

6. **Tenant overlay at render time.** Same corpus, different views per tenant profile. Filtering and scoring happens at retrieval, not in the corpus itself.

7. **Versioned and refreshable.** Industry context changes. Corpus has version history. Refresh cadence quarterly minimum, monthly preferred.

---

## Success criteria

This package is complete when:

- ✅ Schema is locked (KNOWLEDGE_CORPUS_SCHEMA.md committed)
- ✅ Agent query contracts defined (AGENT_QUERY_CONTRACTS.md)
- ✅ Provenance discipline locked
- ✅ Cross-reference graph defined
- ✅ Tenant overlay logic specified
- ✅ Curation pipeline defined (v0/v1/v2 sourcing strategy)
- ✅ Three executable prompts ready (retail · healthcare · agent integration)
- ✅ Runbook written for Claude Code execution

After population executes (via prompts in separate sessions), success extends to:

- ✅ ~45 use cases populated across retail + healthcare
- ✅ ~50 patterns populated
- ✅ Vendor + SI landscapes populated
- ✅ Regulatory context populated
- ✅ Sentinel/Source/Nexus wired to corpus
- ✅ Castillo's persona scenario in journey kit demonstrably shines (probes pass with corpus-grounded responses)

---

## What this package is NOT

- Not a content marketing exercise. The corpus is internal substrate consumed by agents. Customer-facing renderings are downstream surface work.
- Not a competitive analysis. We're not ranking vendors or producing "buyer's guides." We're producing structured factual substrate about the AI landscape that agents reason over.
- Not a one-time data dump. The corpus is living substrate that refreshes via the v1/v2 sourcing strategies.
- Not pretending to be exhaustive. The corpus covers the AI bets that matter for AbarVa's bet-shaping thesis. Esoteric or niche use cases are out of scope.

---

## Begin

Read master-prompt.md to understand the operational frame, then proceed through the architecture files in order before any prompt execution.
