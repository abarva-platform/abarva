# AbarVa Expert Training System

## Purpose

Sentinel, Nexus, Source, Atlas, and Steward must not behave like generic LLM
wrappers. They must behave like bounded expert operators that combine tenant
context, industry corpus, AI innovation patterns, and module-specific
deliverables.

This document defines the minimum standard for vertical expertise training and
evaluation.

## Expert Asset Stack

| Asset | Role in agent expertise | Minimum per serious vertical |
|---|---|---:|
| Tenant context | Client-specific apps, vendors, contracts, initiatives, KPIs, org, risks, policies | 500-5,000 records |
| Industry corpus | Operating patterns, failure modes, benchmarks, vendor traps, modernization lessons | 10,000-25,000 patterns |
| AI innovation corpus | AI use cases, startup ecosystem, agentic workflows, model governance, procurement traps | 2,000-7,500 patterns |
| Persona playbooks | How each CXO thinks, what evidence they trust, what objections they raise | 50-100 playbooks |
| Deliverable templates | Move canvases, business cases, board memos, RFPs, BAFO counters, Tower scorecards | 100-250 templates |
| Eval cases | Retrieval, reasoning, deliverable, adversarial, and board-pressure cases | 5,000-10,000 cases |
| Scoring rubrics | What excellent means by module, persona, difficulty, and decision type | 200-500 rubrics |

## Agent Responsibilities

| Agent | Product module | Expert behavior |
|---|---|---|
| Sentinel | Intelligence | Diagnose, compare, challenge, cite, name evidence gaps, and recommend the next Move. |
| Nexus | Moves | Convert a rough idea into a fundable Move with value model, gates, risks, adoption plan, and unsafe-to-fund conditions. |
| Source | Source | Create sourcing strategy, RFP questions, BAFO counters, contract protections, savings proof, and vendor-risk posture. |
| Atlas | Tower | Track portfolio pressure, value realization, dependencies, risk, adoption, and board-ready status. |
| Steward | Setup | Govern context-layer readiness, provenance, data trust, and source-system ingestion gaps. |

## Evaluation Difficulty Ladder

| Level | Name | What it proves |
|---|---|---|
| L1 | Recall | Agent can retrieve the right tenant facts. |
| L2 | Explanation | Agent can explain why a tenant-specific issue matters. |
| L3 | Diagnosis | Agent can separate symptoms, root causes, constraints, and missing evidence. |
| L4 | Recommendation | Agent can rank options, name dissent, and state confidence. |
| L5 | Deliverable | Agent can produce a useful Move, sourcing packet, setup map, or scorecard. |
| L6 | Adversarial | Agent refuses unsupported claims and catches hallucination or tenant bleed. |
| L7 | Cross-module | Agent can move Intelligence to Moves to Source to Tower without losing evidence. |
| L8 | Board/CXO | Agent can withstand skeptical executive pressure with quantified value and risk. |

## Acceptance Bars

| Gate | Requirement |
|---|---|
| Smoke | 500 random cases per vertical, zero schema errors, zero tenant mismatch |
| Release | 2,000 cases per vertical, at least 90% pass, zero hallucinated named entities |
| Expert-grade | Full set, at least 92% pass, at least 80% cite tenant context plus industry corpus plus AI ecosystem |
| Demo-critical | All L8 board/CXO cases for the demo tenant pass, with citation chain and evidence-gap discipline |

## First Executed Slice

The first executed expert-training slice creates large eval assets for the next
two priority fronts:

| Tenant | Vertical | Domains | Cases | Modules | Personas |
|---|---|---:|---:|---:|---:|
| SkyHarbor Air | Airline | 84 | 5,040 | 5 | 10 |
| Meridian Health System | Healthcare | 84 | 5,040 | 5 | 10 |

Artifacts:

- `datasets/evals/skyharbor-airline/expert-eval-cases.jsonl`
- `datasets/evals/skyharbor-airline/domain-taxonomy.json`
- `datasets/evals/skyharbor-airline/manifest.json`
- `datasets/evals/meridian-healthcare/expert-eval-cases.jsonl`
- `datasets/evals/meridian-healthcare/domain-taxonomy.json`
- `datasets/evals/meridian-healthcare/manifest.json`
- `verification/expert-training/2026-05-30-expert-eval-generation-report.md`

## Next Implementation Slice

1. Build an eval runner that samples these JSONL cases and calls the same
   retrieval/synthesis paths used by product surfaces.
2. Score each answer against the embedded rubric.
3. Persist results by tenant, module, persona, domain, and difficulty.
4. Add release gates for demo-critical L8 cases.
5. Convert weak-case failures into corpus, context, prompt, or retrieval
   remediation tasks.

