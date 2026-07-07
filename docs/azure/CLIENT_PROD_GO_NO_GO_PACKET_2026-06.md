# Client Prod Go/No-Go Packet

## Purpose

This packet makes ENV-17 executable without improvising. It defines the go/no-go checklist for deploying a pilot client private prod plane after client preprod has passed.

It is intentionally non-mutating. Do not create client prod subscriptions, deploy client prod resources, assign RBAC, migrate or reload client data, refresh client prod search indexes, run client prod smoke tests, change DNS, or shift traffic from this packet without explicit approval.

Machine-readable companion: `docs/azure/CLIENT_PROD_GO_NO_GO_PACKET_2026-06.json`.

Verifier: `npm run azure:client-prod-go-no-go:verify`.

## Scope

This packet applies only to `client-prod`.

It does not apply to AbarVa Product Prod, Product Preview, Product Dev, or client preprod. It also does not authorize DNS changes or production traffic shifts; those require separate explicit approval.

## Required Approval Before Execution

Explicit approval is required before:

- accepting client preprod evidence as sufficient
- creating a client prod subscription
- deploying client prod resources
- assigning client prod RBAC
- migrating or reloading client prod data
- refreshing client prod search indexes
- running client prod smoke tests
- accepting support readiness
- recording the client prod go/no-go decision

## Go/No-Go Stages

The go/no-go packet must produce evidence for:

- preprod acceptance review
- data policy review
- security and RBAC review
- network/private-connectivity review
- cost, budget, and tag review
- observability and alerting review
- backup, restore, and DR review
- migration or reload plan review
- context health acceptance review
- retrieval and citation acceptance review
- context bundle acceptance review
- module UAT acceptance review
- artifact/file cabinet acceptance review
- support runbook acceptance review
- rollback and abandon review
- executive go/no-go

## Promotion From Preprod Bar

Do not move toward client prod unless the packet proves:

- same canonical client key
- same approved policy manifest
- same no-PHI/no-PII posture
- same template versions
- same fact identity rules
- same citation requirements
- same context-bundle bar
- no unreviewed data promoted
- no `agent_ready` auto-promotion

## Client Prod Smoke Routes

At minimum, signed-in client prod smoke proof must cover:

- `/home`
- `/intelligence`
- `/strategic-moves`
- `/source`
- `/tower`
- `/setup/admin`

## Hard Stops

Stop if any of these are true:

- client preprod is not approved
- go/no-go minutes are missing
- PHI is present
- PII is present without a future explicit policy change
- wrong-tenant context is detected
- duplicate active facts or chunks are detected
- orphan facts are detected
- context bundle trace is missing
- citations are missing
- unsupported claims are unflagged
- backup/restore is unproven
- rollback plan is missing
- support coverage is missing
- DNS change is requested without separate approval
- production traffic shift is requested without separate approval
- broad Owner or User Access Administrator grant is requested

## Completion Rule

ENV-17 is scaffold-ready when this packet and its verifier are merged.

ENV-17 is complete only after an approved client prod go/no-go run produces the evidence bundle, client preprod acceptance is approved, client prod evidence passes, signed-in smoke proof passes, support coverage is active, and rollback proof exists.
