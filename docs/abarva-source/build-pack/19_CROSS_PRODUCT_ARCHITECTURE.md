# 19 CROSS PRODUCT ARCHITECTURE

## Purpose

This file clarifies how AbarVa Source fits inside the broader AbarVa platform.

The product direction is:

- AbarVa is the platform.
- Source is a workflow product inside AbarVa.
- Pattern Fabric, Agent Fabric, Artifact Studio, Control Tower, and Value Ledger are shared platform capabilities.
- Source owns sourcing-specific domain objects, workflow state, UI surfaces, gates, artifacts, and commercial logic.

## Core Answers

| Question | Answer |
|---|---|
| Is Source standalone or inside AbarVa? | Source is a workflow product inside the AbarVa platform. It may be sold with per-event economics, but architecturally it should use platform primitives. |
| What does Source share with broader AbarVa? | Agent identities, pattern infrastructure, artifact generation model, value ledger concepts, control tower aggregation, identity, tenant boundaries, evidence model, audit logging. |
| What is Source-specific? | Sourcing events, sourcing stages, sourcing lifecycle statuses, sourcing pattern packs, scorecard governance, vendor selection artifacts, sourcing value fields, sourcing failure modes. |
| How does Source relate to Programs? | Programs and Source are sibling workflow products. Programs manage transformation execution; Source manages vendor/sourcing decisions. They should not share legacy mocks or UI shells. |
| How does Source relate to Intelligence? | Intelligence can expose reusable patterns, evidence, benchmarks, and observations that Source consumes through Pattern Fabric. |
| How does Source relate to Control Tower? | Control Tower should eventually aggregate Source events and non-Source programs, while Source keeps its own sourcing dashboard for operational control. |
| How does Source relate to Value Ledger? | Value Ledger is a shared concept. Source surfaces sourcing-specific projected value, assumptions, confidence, measurement owner, and realized value attribution. |
| How does Source use Pattern Fabric? | Pattern Fabric provides archetypes, required inputs, stage gates, scorecard defaults, artifact templates, failure modes, and Nexus guidance. |
| Are patterns shared across AI transformation programs and sourcing events? | Yes at the platform pattern layer, but Source pattern packs must specialize for sourcing decision mechanics. |
| Does Control Tower show Source events and Programs together? | Eventually yes, with filtering and rollups. Source must still have a dedicated dashboard for sourcing-specific operations. |
| Does Value Ledger aggregate across Source and non-Source work? | Eventually yes. Source values should roll into platform value views while preserving sourcing event attribution. |
| Are Nexus, Sentinel, Atlas, and Steward shared or product-scoped? | They are shared agent identities with Source-specific contracts, prompts, retrieval scopes, and handoff rules. |
| What belongs at the platform layer? | Identity, tenant isolation, Pattern Fabric, Agent Fabric, Artifact Studio, Evidence Store, audit logging, Control Tower aggregation, shared Value Ledger primitives. |
| What belongs inside Source? | Event model, event lifecycle, sourcing stages, sourcing gates, Source dashboard, event canvas, scorecard governance, artifact drawer semantics, vendor process, Source-specific value fields. |

## Architecture Options

### Option A: Standalone Source Product

Source is built as a separate product with its own agents, patterns, artifacts, ledger, and dashboards.

Strengths:

- faster isolated delivery
- simpler mental model for a standalone SKU
- fewer cross-product dependencies

Risks:

- duplicates platform capabilities
- fragments agents and evidence
- makes Control Tower aggregation harder
- weakens AbarVa platform story

### Option B: Source As A Workflow Product Inside AbarVa

Source owns sourcing-specific domain behavior but reuses shared platform primitives.

Strengths:

- strongest platform coherence
- supports Source-specific depth without duplicating infrastructure
- lets Control Tower and Value Ledger aggregate across products
- positions AbarVa as decision intelligence platform, not a point solution

Risks:

- requires clear boundaries to avoid coupling to legacy Programs
- platform primitives must be designed for multiple workflows
- naming and navigation must clarify Source as first-class

### Option C: Source As A Feature Under Programs

Source is nested inside Programs as a sourcing module.

Strengths:

- uses existing transformation surfaces
- simpler initial nav

Risks:

- makes Source feel secondary
- creates procurement-to-transformation confusion
- increases risk of legacy `/programs` coupling
- weakens per-event commercial model

## Chosen Direction

Choose Option B: Source as a workflow product inside AbarVa.

This gives Source enough product identity to be commercially meaningful while keeping AbarVa's platform architecture coherent.

## Platform Capability Boundaries

| Capability | Platform-Owned | Source-Owned |
|---|---|---|
| Pattern Fabric | pattern storage, versioning, retrieval, observation loop | sourcing archetypes, stage gates, scorecard defaults, artifact rules |
| Agent Fabric | Nexus, Sentinel, Atlas, Steward identities and runtime | Source-specific per-turn contracts and retrieval scopes |
| Artifact Studio | generation framework, evidence binding, versioning | RFP package, scope doc, scorecard, decision memo semantics |
| Evidence Store | citation model, confidence, tenant isolation | sourcing evidence requirements and source categories |
| Control Tower | cross-product rollup and executive visibility | sourcing dashboard and event status signals |
| Value Ledger | shared value line item primitives and rollup | sourcing value assumptions, confidence, and event attribution |
| Audit Logging | event capture and immutable trail | sourcing gate, scorecard, artifact, and decision audit events |

## Source Domain Objects

Source should define its own domain model for:

- sourcing event
- sourcing archetype
- event lifecycle status
- workflow stage
- stage gate
- required input
- sourcing artifact
- evaluation criterion
- scorecard approval and lock
- vendor response later
- value line item
- lifecycle alert

These objects should not depend on `src/lib/programs/mock.ts`.

## Cross-Product Data Flow

```text
Pattern Fabric
  -> Source pattern pack
  -> Source event stage/gate/artifact/scorecard defaults
  -> Nexus guidance and Steward enforcement
  -> Evidence Store and Artifact Studio
  -> Source dashboard, event canvas, Value Ledger
  -> Control Tower rollup later
```

## Implementation Guardrails

- Do not implement Source through legacy `/programs` surfaces.
- Do not use `ProgramSurface` for Source.
- Do not import `src/lib/programs/mock.ts` into Source.
- Keep Source route family under `/source`.
- Keep Source first-class in operator navigation.
- Do not expose Source to client nav until explicitly approved.
- Shared platform primitives may be introduced later, but Source should not wait on overbroad platform refactors.

## Acceptance Standard

Architecture is acceptable only when:

- Source can stand as a first-class workflow product
- shared platform primitives are identified
- Source-specific domain boundaries are explicit
- Control Tower and Value Ledger future aggregation is possible
- no legacy Program mock or shell dependency is introduced
