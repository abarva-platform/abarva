# Client Data Onboarding Process

Status: scaffold-ready, not executed

Canonical source: `docs/azure/CLIENT_DATA_ONBOARDING_PROCESS_2026-06.md`.

Client data onboarding is separate from AbarVa product/control-plane data. It must run through governed Admin bulk loading or an approved operator job and must produce a full evidence chain.

## Intake Checklist

- client signoff
- environment selected: Client Preprod or Client Prod
- data classification assigned
- minimum necessary data confirmed
- manifest and template version provided
- source files staged
- parser identified
- review-required formats flagged
- low-confidence facts routed to review
- retention and deletion requirements confirmed
- access approval recorded

## Required Pipeline States

source files received -> Azure Blob staged -> source files registered -> enterprise context records committed -> facts committed -> chunks committed -> current view refreshed -> search indexed -> tenant-scoped retrieval proved -> citation metadata rendered -> promotion status calculated -> context bundle trace proved -> module readiness calculated.

## Rules

Do not call chunks-only data ready. Do not call facts-only data ready. Do not call indexed-only data ready. Context-bundle proven is the real bar. No row auto-promotes to `agent_ready`.
