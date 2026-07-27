# Phase 2B-3C-2B Security and Private-Network Hardening Plan

## Scope

Tenant: `airline-demo-new`

This package is plan-only. It does not authorize Azure apply, database migration, source landing, parsing, publication, or runtime integration.

## Security Boundary

- Operational storage: `stabairdnlabeus001`
- Evaluator-only storage: `stabairdnevallab001`
- Database: `abarva_airline_demo_new_knowledge_lab`
- Key Vault: `kv-abarva-airdn-lab-001`
- Container Apps environment: `cae-abarva-airdn-lab-eus-001`

The evaluator storage account is the hidden-truth boundary. Parser, ingest, Claude-facing, runtime, Home, Source, and aVa identities receive no role assignment on `hidden-truth`.

## Evaluator Firewall

| Actor | Hidden truth | Published reconstruction | Knowledge mutation |
| --- | --- | --- | --- |
| Parser / ingest | no | no | candidate-only |
| Reviewer | no | no | review decision only |
| Publisher | no | yes | accepted publication only |
| Runtime reader | no | yes | no |
| Evaluator | yes | yes | no |

## Required Before Apply

1. Run global name checks for `stabairdnlabeus001`, `stabairdnevallab001`, and `kv-abarva-airdn-lab-001`.
2. Re-run VNet and peering collision scan.
3. Run Azure what-if and parse it with the safety gate.
4. Confirm no deletes, no public network access, and no out-of-scope shared runtime modifications.
5. Confirm dollar-based budget guardrails are created before any resources are applied.
6. Pass the zero-data preflight from real ACA jobs before migration.
