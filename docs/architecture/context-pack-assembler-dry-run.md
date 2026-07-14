# Context Pack Assembler Dry-Run

Status: candidate design proof for `KNOWLEDGE-LAYER-DESIGN-PR2`.

## Purpose

The Context Pack Assembler turns a tenant-scoped module request into a governed
context packet:

```text
user question or module request
-> tenant resolution
-> generic intent classification
-> archetype domain requirements
-> context catalog resolution
-> entity profiles
-> canonical facts
-> relationship candidates
-> gaps and unsupported claims
-> Claude-ready governed payload
```

This is the bridge from "we have rich tenant data" to "aVa and modules receive
the right context before reasoning."

## Hard Boundary

This PR is a dry-run supplier proof only.

It does not:

- call Claude,
- change Home, Intelligence, Moves, Source, or Tower runtime behavior,
- attach evidence to a Move,
- create Source events,
- calculate Tower value,
- promote candidates,
- update Active Tenant Access,
- write production tenant data.

## Generic Intent Rule

Use cases must not become hardcoded branches.

The assembler must not implement code shaped like:

```text
if exact use case name, then use this path
if exact focus name, then use this path
if exact validation fixture, then use this path
```

Instead, the assembler uses reusable archetypes:

- `analytics_modernization`
- `customer_service_ai`
- `risk_ai_copilot`
- `sourcing_optimization`
- `operations_recovery`
- `transaction_automation`
- `general_enterprise_context`

Named proof examples are only fixture inputs:

- Finance Analytics is an instance of `analytics_modernization`.
- Agent Assist is an instance of `customer_service_ai`.
- Fraud Analyst Copilot is an instance of `risk_ai_copilot`.

## Dry-Run Requests

The PR2 proof executes five module requests through the same generic assembler:

1. Home / Meridian Health / "Explain Finance Analytics context and gaps"
2. Moves / Meridian Health / "We want to explore Agent Assist for member service" / P2
3. Intelligence / HarborTrust Bank / "Assess Fraud Analyst Copilot readiness"
4. Tower / Meridian Health / "What budget and value context exists for Finance Analytics?"
5. Source / Meridian Health / "What vendor and contract context exists for analytics managed services?"

Each request must show:

- resolved tenant context,
- selected context catalog entry,
- archetype classification,
- required domains,
- entity profiles,
- evidence references,
- relationship candidates,
- gaps,
- unsupported claims,
- Claude-ready payload,
- active/candidate truth boundary.

## Claude-Ready Payload

The Claude-ready payload is a design artifact in this PR. It is the governed,
model-visible subset of the context packet. It must exclude:

- audit-only diagnostics,
- inactive candidate context unless explicitly requested,
- unsupported claims as facts,
- source-adapter-only facts unless explicitly requested.

Unsupported claims are preserved in the audit-visible context pack, but the
Claude-ready payload must not expose them as facts.

## Proof Outputs

The audit command writes:

```text
reports/enterprise-knowledge-layer/assembler-proof/summary.md
reports/enterprise-knowledge-layer/assembler-proof/summary.json
reports/enterprise-knowledge-layer/assembler-proof/home-meridian-finance-analytics.json
reports/enterprise-knowledge-layer/assembler-proof/moves-meridian-agent-assist-p2.json
reports/enterprise-knowledge-layer/assembler-proof/intelligence-harbortrust-fraud-copilot.json
reports/enterprise-knowledge-layer/assembler-proof/tower-meridian-finance-analytics.json
reports/enterprise-knowledge-layer/assembler-proof/source-meridian-analytics-vendor-context.json
reports/enterprise-knowledge-layer/assembler-proof/context-pack-assembler-proof.html
```

Run:

```bash
npm run audit:enterprise-knowledge-assembler
```

## Follow-On Ladder

1. PR3 - Home Knowledge Surface dry-run using entity profiles.
2. PR4 - Moves phase-aware context pack integration behind a non-default flag.
3. PR5 - Tower/Source context pack dry-run.
4. PR6 - Runtime integration after proof and review.
