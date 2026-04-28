# Platform Layered Architecture

## Purpose

Define the shared platform layers under all AbarVa product surfaces.

## Layers

1. Product Surfaces: Programs, Source, Intelligence, Control Tower, Admin/Setup, and Home.
2. Product APIs: surface-specific routes and commands.
3. Agent Runtime: Nexus, Sentinel, Atlas, and Steward orchestration.
4. Context Builder: work-object context assembly and validation.
5. Knowledge Fabric: vector, graph, relational state, object/raw files, and evidence ledger.
6. Tool Layer: approved deterministic tools and side-effect controls.
7. Model Gateway: provider routing, policy, logging, fallback, and cost controls.
8. Governance/Audit: claim-to-source, approvals, permissions, and runtime trace.
9. Persistence/Infrastructure: database, object storage, queues, caches, logs, and deployment environment.

## Boundary Rule

Product surfaces can request work. They do not own prompt assembly, model calls, parsing pipelines, or evidence governance.

## Surface Responsibilities

Product surfaces define the user question, work object, allowed actions, and view state. Shared services decide what context exists, what evidence supports a claim, whether a tool can run, and how a model call is made.

## Acceptance

A surface is architecturally ready only when its page data contract, product API boundary, context requirements, and evidence requirements are documented.
