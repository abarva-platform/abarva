# AZLAB5 - Azure Lab Deployment Runbook

Slice ID: AZLAB5
Slice name: Azure Lab Deployment Runbook
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane L (parallel build run)
Depends on: ARCH3, CLOUD2, CLOUD5, TEN1

## Goal

Land a comprehensive, engineer-ready runbook that guides setup of a
lab-grade Azure private data plane simulation — covering VNet,
Container Apps, PostgreSQL Flexible Server, Blob Storage, Key Vault,
Application Insights, and Log Analytics — along with cost guardrails,
deployment verification steps, and explicit simulation-vs-real and
what-not-to-claim disclosures.

## Files

### Created

- `docs/deployment/AZURE_PRIVATE_DATA_PLANE_LAB_RUNBOOK.md` —
  full runbook with all provisioning commands, verification steps,
  cost guardrails, cleanup instructions, and simulation boundary
  disclosures.

### Updated

- `docs/build/build-slices.json` — AZLAB5 entry appended.
- `docs/build/production-readiness.json` — note appended to the
  `production_deployment` component. No status fields changed.
- `docs/build/build-waves.json` — wave-12 appended.

## Scope

Documentation only. No application code, no runtime modification,
no migrations, no model calls, no production systems touched.

## Code complete: 2026-04-26

The following conditions are met for `code_complete`:

1. Runbook document exists at the canonical path under
   `docs/deployment/`.
2. All Azure CLI commands are complete and self-consistent from
   resource group creation through cleanup.
3. Simulation-vs-real and what-not-to-claim sections are present
   and explicit.
4. Cost guardrails (budget alert, scale-to-zero, Postgres pause)
   are documented.
5. JSON manifests updated without status promotion.

## What is NOT claimed

- No production-readiness component status is promoted.
- No deployment occurred; this is documentation only.
- No compliance attestation or data residency proof.
