# Phase 3C-2E Executable Shared Data Layer

Status: executable migration and validation package only. This package does not apply Azure infrastructure, land source files, run parser jobs, publish a tenant baseline, deploy Cube, wire Home, or shift runtime traffic.

This turns the approved Phase 3C-2D consumption contract into the first tenant-agnostic Azure/Postgres implementation slice:

1. Source registry, evidence, working, canonical Knowledge, metrics, governance, publication, consumption, audit, and operations schemas.
2. Knowledge Baseline and domain-publication control tables.
3. Versioned consumption read models for Home, Source, Tower, Moves, Intelligence/aVa, Cube, and future analytics surfaces.
4. Relational graph projection tables and recursive SQL traversal helpers.
5. Static validation that blocks legacy-module inputs, hidden-truth sourcing, wildcard tenants, and graph-engine coupling.

## Execution Boundary

This package is shared infrastructure code. It contains no tenant facts and no accepted Knowledge rows.

Airline Demo New and Healthcare Demo New must apply this package only inside their dedicated private data planes after their own execution authority and zero-data proof gates pass.

## Canonical Flow

Raw source files -> source registry -> evidence -> working candidates -> review decisions -> canonical Knowledge and metrics -> domain publication -> Knowledge Baseline -> consumption projection versions -> Home, Source, Tower, Moves, Intelligence/aVa, Cube.

## Graph Path

The initial graph path is relational PostgreSQL:

- `knowledge.relationship_assertion`
- `publication.domain_publication`
- `publication.knowledge_baseline`
- `consumption.relationship_node_v1`
- `consumption.relationship_edge_v1`
- `consumption.relationship_evidence_v1`
- recursive SQL traversal helpers

Graph accelerators are out of scope for P0/P1 tenant load. They may be evaluated later as read-side accelerators only after the relational graph path is measured and proven.

## Files

- `sql/001_shared_knowledge_publication_consumption.sql` — shared Azure/Postgres migration.
- `cube/knowledge_consumption_model.yml` — initial Cube semantic model contract over `consumption.*` only.
- `jobs/publication_projection_job_contract.json` — governed ACA job-stage contract for publication and projection.
- `validation/expected-contract.json` — static validator expectations.
