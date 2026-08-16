# 2026-08-16-tenant-contract-packet-adapter — Tenant vendor-register contract packet adapter

## Release ID

`2026-08-16-tenant-contract-packet-adapter`

## Status

`candidate`

## Plain-English Summary

The contract packet generator now has a safe path from a settled active tenant vendor register to
client-showable synthetic contract packets. The new adapter reads the tenant's vendor-contract
input, creates the packet-specific register, pricing schedule, service levels, invoice lines and
rate card, then lets the existing generator, reconciler and clause benchmark run unchanged.

For the current tenant proof, the adapter reads
`datasets/tenant-inputs/active/meridian-health/current/07_vendors_contracts.csv`.

The adapter does not render recognizable source supplier names into synthetic legal instruments.
It substitutes invented supplier legal entities while preserving the commercial shape needed for a
useful demo: contract value, term, renewal window, risk posture, service category and owner role.

## Layer Impact

**Release lane: `internal-admin`.** This is operator tooling for creating ignored demonstration
artifacts from repo-local synthetic tenant input. It does not load, activate, index, promote or
publish tenant data.

- **Layer 1 (client intake):** read-only use of active tenant input CSVs. No source CSV is changed.
- **Layer 2 (source adapters):** no change to product adapters. The new script is an offline packet
  fixture adapter for contract demonstration artifacts.
- **Layer 3 (canonical model):** no change. Nothing is written to canonical tables or graph
  substrate.
- **Layer 4 (products):** no product/runtime read path changes. Generated packets are ignored
  artifacts under `.artifacts/contract-packets/`.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — operator tooling and generated synthetic demo artifacts
- Public/demo only: yes — generated artifacts can explain template fill patterns and extraction
  reconciliation, but remain synthetic and not legal advice
- Feature flag: none

## Changes Included

- `scripts/data/contract-packet/prepare-tenant-contract-fixture.mjs` — derives packet fixture CSVs
  from an active tenant vendor register using synthetic supplier aliases.
- `package.json` — adds `packet:check:meridian` and its prepare/generate/reconcile/benchmark
  subcommands.
- `scripts/data/contract-packet/README.md` — documents tenant packet generation and the
  real-vendor-name safety boundary.

## QA / Validation

- `npm run packet:check` — staging fixture still passes: 3 contracts, 24 documents, 281/281
  reconciliation assertions, 100% required clauses across the generator's eight document types.
- `npm run packet:check:meridian` — tenant-derived fixture passes: 8 contracts, 64 documents,
  784/784 reconciliation assertions, 100% required clauses across the generator's eight document
  types.
- `npm run release:check` — pending before PR.

## Rollout Plan

Merge to main. The repo-owned ACA deploy workflow may run because main deploys are repository
standard, but this change has no runtime dependency and no product surface reads the generated
artifacts.

## Deployment Authority

- Repo-owned deploy workflow: allowed if triggered by merge to main
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: resolved by the repo-owned deploy workflow if it runs
- ACA runtime invariant: required only if the repo-owned deploy workflow runs
- Worker image invariant: required only if the repo-owned deploy workflow runs
- Feature/env flag update path: none
- Live signed-in proof required: no product surface changed

## Rollback Plan

Revert the commit. Generated packet outputs are ignored artifacts and can be deleted/regenerated
locally; no data-plane, canonical, graph, retrieval or runtime state is created by these scripts.

## Audit Evidence

- `npm run packet:check` output.
- `npm run packet:check:meridian` output.
- `npm run release:check` output.
- Generated ignored artifact paths:
  `.artifacts/contract-packets/meridian-health-fixture/` and
  `.artifacts/contract-packets/meridian-health/`.

## Known Gaps

- The adapter generates Markdown demonstration documents, not PDF or DOCX packets.
- The tenant packet set is synthetic and not legal advice. It should be shown as a template-filling
  and reconciliation demonstration, not as a real negotiated agreement or live-client truth.
- The adapter currently selects a bounded sample of eight vendor-register rows by annual value.
- The clause benchmark is a generator completeness gate for those eight rendered document types. It
  is not a claim that the packets cover the Source product's full extraction taxonomy or every
  contract document type a procurement team may supply.
