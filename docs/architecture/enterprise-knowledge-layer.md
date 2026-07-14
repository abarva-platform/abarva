# Enterprise Knowledge Layer

Status: design baseline for `KNOWLEDGE-LAYER-DESIGN-PR1`.

## Purpose

The Enterprise Knowledge Layer is the governed context contract between tenant
data and AbarVa modules. It prevents product modules from each inventing their
own local data interpretation.

The product rule is:

```text
User question or module action
-> tenant-scoped context request
-> governed context pack
-> Claude reasoning over that pack
-> cited answer, artifact, or workflow recommendation
```

AbarVa must not send tenant questions directly to Claude when a context pack can
be assembled.

## Scope

This layer defines:

- evidence references,
- canonical facts,
- entity profiles,
- relationship edges,
- context gaps,
- confidence summaries,
- module context requests,
- module context responses,
- active-vs-candidate truth boundaries.

It does not decide UI layout, promote candidate data, write production tenant
tables, or change module runtime behavior by itself.

## Source Layers

The Knowledge Layer consumes governed data from:

```text
Tenant Inputs
-> Canonical Build
-> Candidate / Active Data
-> Module Context Serving Contract
-> Enterprise Knowledge Layer context packs
-> Home / Intelligence / Moves / Source / Tower
```

The active context path is the default. Candidate and synthetic fixture context
must be requested explicitly and must remain labeled.

## Core Objects

| Object | Role |
| --- | --- |
| `EvidenceRef` | Source, authority, as-of date, confidence, citation status, and truth status for a claim. |
| `CanonicalFact` | A tenant-scoped assertion attached to evidence and caveats. |
| `EntityProfile` | A business-readable profile for a function, system, data domain, vendor, metric, risk, use case, process, or enterprise. |
| `RelationshipEdge` | A governed source-to-target link with business meaning and validation status. |
| `ContextGap` | Missing evidence, missing owner, missing relationship, stale source, or unsupported-claim risk. |
| `ContextPack` | The assembled context packet a module can use before Claude reasoning. |
| `ModuleContextRequest` | The read request shape that declares module, purpose, scope, evidence policy, and relationship policy. |
| `ModuleContextResponse` | The context pack plus deterministic explanation and Claude-ready payload. |

## Design Fixtures

The first proof uses the semantic-depth clusters from PR #4802:

- Meridian Health - Finance Analytics
- Meridian Health - Agent Assist / Member Service
- HarborTrust Bank - Fraud Analyst Copilot

These fixtures prove that rich tenant stories can be represented as connected
profiles, facts, evidence, gaps, and module packs without flattening into
generic inventory rows.

## Non-Goals

- No Home redesign.
- No Moves evidence attachment.
- No Source event mutation.
- No Tower value calculation.
- No Active Tenant Access update.
- No production tenant data write.
- No candidate promotion.

## Next Step

The next implementation step should be `KNOWLEDGE-LAYER-DESIGN-PR2`, a
non-runtime Context Pack Assembler dry run that converts selected canonical
records into these contracts without changing module behavior.

Planned ladder:

1. PR2 - Context Pack Assembler Dry-Run.
2. PR3 - Home Knowledge Surface dry-run using entity profiles.
3. PR4 - Moves phase-aware context pack integration behind a non-default flag.
4. PR5 - Tower/Source context pack dry-run.
5. PR6 - Runtime integration after proof and review.
