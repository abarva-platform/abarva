# AI Value Office Transformation Backlog

## North Star

AI Value Office should become the operating system for turning AI ideas into approved, measurable, evidence-backed initiatives.

The product workflow is:

1. Intake
2. Qualification
3. Workspace
4. Review
5. Execution

The experience should feel:

- premium
- calm
- workflow-driven
- executive-ready
- opinionated

## Wave 1 — Product Spine

Status: Complete

Goals:

- clean module-level navigation
- clean use-case workflow navigation
- split the monolithic use-case page into purpose-built tabs
- preserve existing save flows

Delivered:

- secondary AI Value Office nav below the global app header
- contextual use-case nav
- route structure:
  - `/value-office/portfolio`
  - `/value-office/new`
  - `/value-office/reviews`
  - `/value-office/execution`
  - `/value-office/knowledge`
  - `/value-office/[useCaseId]/overview`
  - `/value-office/[useCaseId]/value`
  - `/value-office/[useCaseId]/evidence`
  - `/value-office/[useCaseId]/outcomes`
  - `/value-office/[useCaseId]/review`
  - `/value-office/[useCaseId]/history`
- shared use-case workspace provider
- overview, value contract, evidence, outcomes, review, and history sections split into their own screens

Review gate:

- navigation clarity improved
- workflow progression is obvious
- giant use-case page removed
- build passes

## Wave 2 — Intelligence Layer

Status: Complete

Goals:

- deterministic decision engine
- contradiction engine
- reusable knowledge layer foundation

Delivered:

- decision engine with transparent states:
  - `ready_for_pilot`
  - `tighten_before_pilot`
  - `hold_and_design`
- contradiction engine for:
  - missing baselines
  - missing evidence owners
  - blocked or stale evidence
  - weak evidence against strong recommendations
  - incomplete outcome lines
- reusable knowledge layer for:
  - client truth
  - public benchmarks
  - pattern memory
  - failure patterns
  - intervention playbooks
- overview and review surfaces now show:
  - recommendation state
  - rationale
  - contradictions
  - interventions
  - knowledge context

Review gate:

- recommendation state is explained
- contradictions are surfaced clearly
- knowledge is reusable and not just prompt decoration
- build passes

## Wave 3 — Executive Experience + Demo Hardening

Status: In progress

Goals:

- make reviews executive-ready
- make execution feel like the next natural step after approval
- polish demo reliability and clarity

Delivered so far:

- improved reviews page with decision-state-aware queue
- improved execution page with evidence and outcome progress
- stronger intake page with demo examples
- save success banners across workflow sections
- better empty and error states
- clearer executive review experience

Still to refine:

- visual polish pass across all tabs for even calmer hierarchy
- authenticated browser verification of the full workflow
- final demo-path QA:
  - portfolio -> new use case -> overview -> value -> evidence -> outcomes -> review -> execution

## Current Open Questions

- Should the execution page eventually get its own milestone model, or stay lightweight until real execution tracking is needed?
- Should the knowledge page remain reference-oriented, or become more recommendation/provenance-oriented over time?
- Which use case should become the canonical design-partner demo path:
  - IT service desk automation
  - developer productivity / coding assistants

