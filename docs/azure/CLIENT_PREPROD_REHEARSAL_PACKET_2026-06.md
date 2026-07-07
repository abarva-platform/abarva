# Client Preprod Rehearsal Packet

## Purpose

This packet makes ENV-16 executable without improvising. It defines the rehearsal checklist for the first pilot client in a client preprod private plane.

It is intentionally non-mutating. Do not create subscriptions, deploy resources, assign RBAC, open an upload window, ingest data, refresh search indexes, run signed-in UAT, or mutate any client preprod/prod data from this packet without explicit approval.

Machine-readable companion: `docs/azure/CLIENT_PREPROD_REHEARSAL_PACKET_2026-06.json`.

Verifier: `npm run azure:client-preprod-rehearsal:verify`.

## Scope

This packet applies only to `client-preprod`. Client prod is excluded.

The goal is to rehearse the entire pilot path before a client prod plane exists:

approval -> client preprod subscription/resources -> identity/RBAC -> private connectivity -> governed upload -> parse/review -> records/facts/chunks -> idempotency checks -> search indexing -> tenant-scoped retrieval -> citations -> promotion preview -> context bundle trace -> module readiness -> signed-in browser UAT -> support/rollback proof.

## Required Approval Before Execution

Explicit approval is required before:

- approving a sample client code
- creating a client preprod subscription
- deploying client preprod resources
- assigning client preprod RBAC
- opening a client upload window
- running client preprod ingestion
- refreshing search indexes
- running signed-in UAT
- accepting context-health results

## Required Rehearsal Stages

The rehearsal must produce evidence for:

- approval packet
- subscription and resource proof
- identity/RBAC proof
- private connectivity proof
- client data upload receipt
- parse and review queue proof
- records/facts/chunks proof
- idempotency and duplicate proof
- search index proof
- tenant-scoped retrieval proof
- citation rendering proof
- promotion preview proof
- context bundle trace proof
- module readiness proof
- signed-in browser UAT
- artifact/file cabinet proof
- support and runbook proof
- rollback or abandon proof

## Context Health Bar

Do not call client preprod ready unless the health check proves:

- client id resolved
- tenant key resolved
- source files staged
- source files registered
- records committed
- current facts committed
- current chunks committed
- orphan facts are zero
- duplicate active facts are zero
- duplicate active chunks are zero
- search index is refreshed
- tenant-scoped retrieval works
- citation metadata is present
- promotion status is calculated
- `agent_ready` exists only where eligible
- context bundle trace is present
- wrong-tenant context is excluded
- `not_reviewed`, `blocked`, and `quarantined` rows are excluded
- unsupported claims are flagged

Context-bundle proven is the real bar. Do not call chunks-only, facts-only, or indexed-only data ready.

## Module UAT

At minimum, signed-in browser UAT must cover:

- `/home`
- `/intelligence`
- `/strategic-moves`
- `/strategic-moves/new`
- `/source`
- `/tower`
- `/setup/admin`

Each module proof must cover Intelligence, Moves, Source, and Tower.

## Hard Stops

Stop if any of these are true:

- explicit approval is missing
- client preprod subscription id is missing
- a client prod data action is requested
- DNS or production traffic shift is requested
- a destructive migration is required
- broad Owner or User Access Administrator grant is requested
- PHI is present
- PII is present without a future explicit policy change
- context bundle proof is missing
- wrong-tenant context appears
- duplicate active facts or chunks exist
- `agent_ready` was auto-promoted

## Completion Rule

ENV-16 is scaffold-ready when this rehearsal packet and its verifier are merged.

ENV-16 is complete only after an approved client preprod rehearsal produces the evidence bundle, context health passes, signed-in browser UAT passes, client UAT signoff is captured, and rollback or abandon proof exists.
