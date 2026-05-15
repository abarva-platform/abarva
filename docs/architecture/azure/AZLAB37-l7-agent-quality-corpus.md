# AZLAB37 - L7 Agent Quality Corpus

Date: 2026-05-15  
Status: wired, deterministic validation  
Layer: L7 agent quality

## Why This Exists

AbarVa cannot claim "consultant-grade agents" if agent quality is measured only through founder demos. L7 needs a corpus that states what each agent must do before we run expensive live model evaluations.

This slice creates that baseline:

- 50 golden/adversarial prompt contracts.
- 10 cases each for Sentinel, Atlas, Nexus, Source, and Steward.
- Cross-tenant coverage for Apex Retail, Meridian Health, and First Capital.
- Deterministic schema and coverage validation in CI.

It does not call live models yet. That is intentional: first lock the questions and expected answer shape, then wire execution and scoring.

## Artifacts

| Artifact | Purpose |
|---|---|
| `tests/agent-quality/golden/*.jsonl` | Golden/adversarial prompt contracts by agent. |
| `src/scripts/qa/agent-quality-corpus-validate.ts` | Deterministic corpus validator. |
| `npm run qa:agent-quality:corpus` | Local/CI command. |
| `.github/workflows/agent-quality-corpus.yml` | PR/manual workflow for corpus validation. |

## Coverage

| Agent | Cases | Surfaces |
|---|---:|---|
| Sentinel | 10 | `/intelligence` |
| Atlas | 10 | `/tower` |
| Nexus | 10 | `/strategic-moves`, `/strategic-moves/new` |
| Source | 10 | `/source`, `/source/new`, `/source/value` |
| Steward | 10 | `/home/data-trust`, `/home/connectors`, `/home/production-readiness` |

Categories covered:

- tenant grounding
- strategic business
- AI program
- sourcing/vendor
- move origination
- portfolio risk
- data readiness
- compliance risk
- adversarial
- continuity

## Contract Shape

Each case declares:

| Field | Meaning |
|---|---|
| `agent` | One of `sentinel`, `atlas`, `nexus`, `source`, `steward`. |
| `tenant` | Tenant context the answer must respect. |
| `persona` | CXO lens for the question. |
| `category` | Evaluation bucket. |
| `surface` | Product surface where the prompt belongs. |
| `prompt` | Canonical question. |
| `expected.requiresTenantFacts` | Whether answer must use tenant-specific facts. |
| `expected.requiresCitations` | Whether answer should cite evidence/chunks/records. |
| `expected.requiresDissent` | Whether answer should include pushback or what-would-change-the-view. |
| `expected.requiredTerms` | Terms or concepts expected in a good answer. |
| `expected.forbiddenTerms` | Banned hallucination/leak/failure phrases. |

## How To Run

```bash
npm run qa:agent-quality:corpus
```

## Current Limit

The validator confirms the corpus is complete and well-formed. It does not yet call Sentinel/Atlas/Nexus/Source/Steward, score generated answers, or persist guard telemetry.

## Next L7 Controls

| Next control | Why |
|---|---|
| Live answer runner | Executes each case against the relevant agent surface or API. |
| Shape scorer | Checks required terms, forbidden terms, citations, dissent, tenant facts, and arithmetic/internal consistency. |
| Weekly drift watchdog | Runs corpus against staging/prod and alerts on pass-rate drops. |
| Guard telemetry | Feeds caught-violation and false-positive rates into the C5 dashboard. |
