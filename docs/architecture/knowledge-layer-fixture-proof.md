# Knowledge Layer Fixture Proof

Status: deterministic proof design.

`KNOWLEDGE-LAYER-DESIGN-PR1` uses three PR #4802 semantic-depth clusters to
prove that the Enterprise Knowledge Layer can represent rich business context.

## Fixtures

| Fixture | Tenant | Required proof |
| --- | --- | --- |
| Meridian Finance Analytics | Meridian Health | FunctionProfile, SystemProfiles, DataDomainProfiles, TowerContextPack, SourceContextPack, HomeKnowledgePack, IntelligenceContextPack. |
| Meridian Agent Assist / Member Service | Meridian Health | Phase-aware MovesContextPack with workflows, systems, data, metrics, controls, evidence, and gaps. |
| HarborTrust Fraud Analyst Copilot | HarborTrust Bank | MovesContextPack and IntelligenceContextPack with fraud systems, transaction data, case workflow, model-risk controls, metrics, and gaps. |

## Generated Artifacts

The proof command is:

```text
npm run audit:enterprise-knowledge-layer
```

It writes:

```text
reports/enterprise-knowledge-layer/design-proof/summary.md
reports/enterprise-knowledge-layer/design-proof/summary.json
reports/enterprise-knowledge-layer/design-proof/fixture-meridian-finance-analytics.json
reports/enterprise-knowledge-layer/design-proof/fixture-meridian-agent-assist.json
reports/enterprise-knowledge-layer/design-proof/fixture-harbortrust-fraud-copilot.json
reports/enterprise-knowledge-layer/design-proof/context-pack-proof.html
```

## Pass Criteria

The proof passes only if:

- every fixture produces entity profiles,
- every fixture produces relationship candidates,
- required module packs exist,
- every pack has evidence refs,
- every pack has gaps,
- every pack has unsupported claims,
- every pack has a Claude-ready context payload,
- every Claude-ready payload requires citations,
- every Claude-ready payload requires inference marking,
- every Claude-ready payload excludes audit-only diagnostics, inactive candidate
  context unless requested, and source-adapter-only facts unless requested,
- no pack promotes candidate data,
- no pack writes production tenant data,
- no relationship candidate is treated as validated.

No prompt-only architecture is allowed. The proof must include concrete fixture
outputs showing how the three semantic-depth clusters become entity profiles,
relationship slices, context packs, evidence summaries, unsupported claims, and
assembly traces.

## Truth Split

This proof is a design baseline. It is not a runtime consumption proof. It does
not promote Meridian or HarborTrust data, does not update Active Tenant Access,
and does not change Home, Moves, Source, Tower, or Intelligence behavior.

## Planned Follow-On Sequence

- PR2 - Context Pack Assembler Dry-Run
- PR3 - Home Knowledge Surface dry-run using entity profiles
- PR4 - Moves phase-aware context pack integration behind a non-default flag
- PR5 - Tower/Source context pack dry-run
- PR6 - Runtime integration after proof and review
