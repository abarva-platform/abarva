# AbarVa · Patent Decision Memo

> For founder review before a 1-hour attorney call. Last updated 2026-05-14.
> **Not legal advice.** This is a working brief to focus the attorney conversation, not a substitute for counsel's opinion.

## TL;DR

- **Angle 1 — AgentContextBroker contract: file a provisional.** This is the only one of the three angles with plausible blocking-IP characteristics for the multi-tenant AI SaaS category. ~$3-5k.
- **Angle 2 — Tenant-grounded reasoning architecture: defensive publication.** Strong product narrative, weak claim shape. ~$0-1k.
- **Angle 3 — Sentinel arithmetic / internal-consistency guard: pass, or defensive publication if near-zero cost.** Thin wrapper over an emerging research pattern; not a defensible algorithmic claim. ~$0-1k.
- **Total spend if recommendations followed:** ~$3-6k now. ~$15-25k twelve months from now only if Angle 1 escalates from provisional to full utility.

## Decision framing

Software-composition products usually pass on patents. Most B2B SaaS IP that gets filed never recovers its filing cost — the product moats are distribution, design, and switching cost, not patent enforcement. AbarVa, at pre-seed with one founder, defaults to "pass" on patent strategy.

The exception is when three conditions hold: (1) the claim shape is *different enough* from the prior-art neighborhood that an attorney can write durable language around it, (2) the claimed pattern is *commercially load-bearing* — meaning competitors building in the same category will need to do something materially equivalent, and (3) the claim is *plausibly enforceable* — i.e. infringement is detectable without source-code discovery.

This memo evaluates three candidate angles against those three tests and lands on a recommendation per angle. The total spend if all three were filed as full utilities would be ~$45-75k over 2-3 years, which is a non-trivial fraction of the seed round. The recommendation below brings that down to ~$3-6k upfront with one 12-month decision point.

## Angle 1 — AgentContextBroker contract

**What it is.** A server-side broker (`AgentContextBroker` in the AbarVa codebase) that resolves tenant context — org chart, vendor inventory, KPI definitions, in-flight programs, evidence ledger entries — for any downstream agent *before the agent sees a prompt*. The broker enforces tenant scope at the **data-fetch boundary**, not at the prompt boundary. The application tier is contractually forbidden from importing `EnterpriseDataRoom`, vector store, or graph store directly; everything routes through the broker, which (a) types the returned context bundle, (b) injects warnings when the seed pack and live broker results disagree, and (c) surfaces those mismatches into the prompt as structured caveats so the model never sees a "clean" but stale context view. The broker is the choke point where authorization, observability, and grounding all meet.

**Why it might be novel.** The neighboring patterns in production LLM tenancy today fall into roughly four buckets:

1. *Per-tenant API key with global system prompt.* Trivial; not patentable.
2. *Per-prompt RAG with k-NN vector search.* Standard; well-covered by prior art (LangChain, LlamaIndex, Pinecone, Vertex AI grounding).
3. *JWT-claim-scoped reads with prompt-time scoping.* Emerging; multiple vendors converging here.
4. *Fetch-time-typed, warning-emitting, contract-bound context bundles.* This is where AbarVa sits. The novelty isn't "scope by tenant" — that's RLS. The novelty is the *combination*: the broker is the only legal data path, it returns a typed bundle (not raw rows), and it injects internal-consistency warnings as first-class prompt content rather than logging them out-of-band.

That combination is closer to a SaaS multi-tenancy *primitive* than to a prompting *pattern*. Primitives tend to write better claim language than patterns do.

**Prior art the attorney should check.** LangChain memory adapters and retrievers; Pinecone namespacing and metadata filters; generic Postgres RLS plus pgvector patterns; Anthropic and OpenAI server-side context scoping (e.g. Files API, Memory beta); Vertex AI tenant grounding; Salesforce Einstein Trust Layer; Microsoft Copilot's Graph grounding. The contract-as-only-legal-path constraint and the warning-injection behavior are the differentiators to stress.

**Commercial relevance.** High. Every B2B AI SaaS competitor will need *something* equivalent — anyone selling LLM-powered workflows into regulated industries (finance, healthcare, government, defense) has to solve tenant grounding at the data-fetch layer rather than at the prompt layer, because prompt-layer enforcement fails audit. If claim language captures the "fetch-time + warning-emitting + per-tenant-typed-context-bundle" pattern, this is plausibly blocking IP for the entire multi-tenant AI SaaS category.

**Enforceability.** Moderate. Infringement is partially detectable from public API behavior (a competitor's warning-injection in their prompt logs would be visible to design-partner customers), but the strongest forms of evidence require some source-code discovery in litigation.

**Recommendation.** **File a provisional.** Strongest of the three angles. The provisional buys a 12-month window to (a) refine claim language with the attorney, (b) watch what competitors ship, and (c) decide whether to escalate to a full utility application based on commercial traction. ~$3-5k now; ~$15-25k decision point at month 11.

## Angle 2 — Tenant-grounded reasoning architecture

**What it is.** The end-to-end pipeline: a 14-segment seed context pack ingested per tenant → broker normalization → 15 coverage-by-domain tiles + 6 synthesized "what we know / why it matters" context cards rendered in the UI → the same data piped into every agent prompt across all four product surfaces (Intelligence, Moves, Source, Tower) with tenant-specific arithmetic guards (see PR #1932). The asserted novelty is the *pipeline shape*: structured ingestion, many-to-many normalization, executive-grade summarization, and grounded prompting all driven by a single typed data pack.

**Why it might be novel.** RAG is generic. Per-tenant memory is generic. The specific combination — *industry corpus + tenant overlay + synthesized executive-grade summary cards driven by a typed data pack* — looks more like a system-design assemblage than an algorithmic invention. System-design patents are harder to defend, more design-around-able, and more often invalidated under § 101 (abstract-idea) challenge.

**Commercial relevance.** Medium. The pipeline is what makes AbarVa demoably different in pitch decks; it's a credible differentiator for sales conversations. But "we have a pipeline that does X" rarely blocks a competitor who builds a *different* pipeline that produces the same UI surface. Useful for narrative; questionable for enforcement.

**Recommendation.** **Defensive publication or pass.** A defensive publication (IP.com, TDCommons, or even a timestamped blog post under a defensive-disclosure header) preserves freedom-to-operate, establishes priority date, and signals seriousness — at near-zero cost. No full-utility filing.

## Angle 3 — Sentinel arithmetic + internal-consistency guard

**What it is.** The reflection-on-commit pattern shipped in PR #1932: before an agent answer is committed to the user, a guard layer (a) extracts numeric claims from the candidate answer, (b) re-runs them through a deterministic check (monotonicity, totals, units), and (c) requires the model to restate the answer with the verified numbers. Built on top of any frontier-model response, including Anthropic Claude.

**Why it might be novel.** Reflection and self-check patterns are increasingly common in published research (constitutional AI, self-consistency decoding, Reflexion, Chain-of-Verification). Production-grade arithmetic-specific guards on LLM outputs are less common, but they're a natural and predictable specialization of the published research. This is a thin wrapper rather than a deep architectural claim, and § 101 software-eligibility risk is high.

**Commercial relevance.** Low for blocking IP. High for credibility in regulated industries — wrong numbers in finance or healthcare are catastrophic, and a documented arithmetic guard is a meaningful sales artifact. But that's a marketing-asset value, not a patent-enforcement value.

**Recommendation.** **Pass.** If the attorney call surfaces a near-zero-cost defensive publication path (a paragraph appended to the Angle 2 disclosure), take it. Do not pay for a standalone provisional here.

## Cost summary

| Angle | Recommendation | One-time cost | 12-month follow-on cost |
|---|---|---|---|
| 1 Broker contract | Provisional | $3-5k | $15-25k if full utility |
| 2 Reasoning architecture | Defensive publication | $0-1k | n/a |
| 3 Arithmetic guard | Pass (or fold into Angle 2 pub) | $0-1k | n/a |
| **Total** | **One filing + one/two pubs** | **~$3-6k** | **$15-25k if Angle 1 escalates** |

Cost ranges are grounded in published market rates for US patent-filing legal work as of 2025-2026: provisional applications run $3-5k attorney fees plus a $130-260 USPTO micro/small entity fee; full utility applications run $10-20k drafting plus $1-2k USPTO fees plus $2-4k in prosecution amendments over 18-30 months. International (PCT) adds $4-6k.

## Questions for the attorney call

1. Is the AgentContextBroker claim language defensible in light of the prior-art categories listed above (LangChain retrievers, Pinecone namespacing, Postgres RLS + pgvector, Anthropic/OpenAI server-side scoping, Vertex AI grounding, Salesforce Trust Layer, Microsoft Graph grounding)?
2. Is there a way to file a single broader provisional that captures all three angles under one specification, or are they cleanly separable inventions?
3. What's the realistic chance of grant under USPTO § 101 software-eligibility tests as of 2026, given recent *Alice* and post-*Alice* CAFC rulings?
4. Defensive publication channel of choice — IP.com, TDCommons, an Anthropic developer-blog cross-post, or a timestamped GitHub commit under a defensive-disclosure header?
5. Trademark coverage for "AbarVa" plus the four agent brand names ("Sentinel", "Atlas", "Nexus", "Steward") — bundle into this engagement or scope a separate trademark project?
6. International filing strategy — is a PCT route worth it for Angle 1, given the buyer base is predominantly US Fortune 1000 and large EU enterprises?
7. Time and cost from provisional → granted utility — confirm the typical 2-4 year horizon and $15-30k cumulative cost assumption?
8. Inventor assignment paperwork — single founder today, but what's the right structure if/when a co-founder or first engineer joins inside the 12-month provisional window?

## Decision matrix

| Angle | Novelty | Commercial | Enforceability | One-time cost | Recommendation |
|---|---|---|---|---|---|
| 1 Broker contract | Medium-High | High (blocking) | Moderate | $3-5k | **File provisional** |
| 2 Reasoning pipeline | Low-Medium | Medium (narrative) | Low | $0-1k | **Defensive publication** |
| 3 Arithmetic guard | Low | Low (marketing) | Low | $0-1k | **Pass** (fold into Angle 2 pub) |

## Suggested ADR after the call

Capture the final decision in a single architecture decision record so future contributors and investors can see the reasoning. Suggested path:

`docs/architecture/decisions/0001-patent-strategy.md`

Recommended ADR structure: Context → Decision → Consequences → Status → Review date. Include: which angles were filed, which were published, which were passed, the attorney firm of record, the next review date (12-month mark for Angle 1 escalation), and a pointer back to this memo as the supporting brief.
