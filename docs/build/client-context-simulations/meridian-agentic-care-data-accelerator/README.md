# Meridian Agentic Care Data Accelerator Simulation

Status: published but not app-wired

This folder preserves the repo-backed handoff for the Meridian Health simulation wave generated on 2026-04-30.

## Program Alignment

- App client key: `meridian`
- Data tenant key: `meridian-health`
- Source seed client ID: `MERIDIAN-HEALTH`
- Program ID: `MH-PROG-AGENTIC-CARE-DATA-ACCELERATOR`
- Program name: Agentic Care Data Accelerator
- Lifecycle phase: `P3`
- Sourcing stage: Evaluation
- Active failure modes: `PAT-AI-003`, `PAT-AI-006`, `PAT-AI-008`

## Included Evidence

- `SIMULATION_SEED_PACK.yaml`: simulation seed pack used by the materializer.
- `artifacts/`: five source artifacts covering strategy/current-state minutes, architecture workshop minutes, steering decisions, action register, and solution inputs.
- `handoff/`: app wiring map, source artifact index, validation query pack, and compatibility note.
- `audits/`: corpus manifest, validation report, embedding audit, Pinecone upsert audit, and smoke-test report.

## Publication Facts

- Published index: `abarva-knowledge-corpus-prod`
- Published namespaces: `cross-industry-patterns`, `deliverable-templates`, `industry-financial-services`, `industry-healthcare`, `industry-retail`, `lifecycle-substrate`, `vendor-implementations`
- Embedded vectors: `1026`
- Corpus entries after simulation: `148`
- Smoke tests: pass

## App-Wiring Boundary

This package is deliberately tracked as a handoff, not as proof of production app retrieval.

The app may show a deterministic Meridian program fixture for navigation and validation, but the compatibility status remains `published but not app-wired` until the app query path captures live retrieved IDs from the published index.
