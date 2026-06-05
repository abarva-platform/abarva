# Meridian/PHS Live Reset + Reload Runbook

Date: 2026-06-05  
Lane: client-data-lane / internal-admin  
Scope: Meridian/PHS only

## Purpose

Reset Meridian's stale live context and reload the Sacramento-based integrated delivery network profile through the governed Admin context loader. This must not use seed shortcuts.

## Current Proven State

- Production app is live at `https://app.abarva.ai`.
- Latest loader enhancement is merged in PR #3134 at SHA `7a46d3338913f3474be6fd8451d53fddaee17590`.
- Admin structured loader now accepts CSV, JSON, JSONL, YAML, and YML.
- The local Mac cannot resolve the private Azure Postgres host, so destructive live data changes must run from the Admin UI or a production/private-network runner.

## Operator Preconditions

- Sign in as a Meridian-authorized operator or setup/admin user.
- Active tenant must be Meridian/PHS, not Apex, SkyHarbor, or Lakeshore.
- Confirm uploaded files are from `datasets/meridian-health-synthetic-v1/17-upload-templates/`.
- Use the upload attestation in the Admin loader for every file.
- Do not advance Moves, Tower, or demo claims until context chunks and evidence are visible in Admin.

## Reload Order

1. Upload `enterprise-profile.yaml` with template `enterprise-profile`.
2. Upload `application-portfolio.csv` with template `application-portfolio`.
3. Upload `epic-module-inventory.csv` with template `epic-module-inventory`.
4. Upload `hl7-fhir-integration-topology.json` with template `hl7-fhir-integration-topology`.
5. Upload `data-platform-lineage.csv` with template `data-platform-lineage`.
6. Upload `population-health-risk-panels.csv` with template `population-health-risk-panels`.
7. Upload `value-based-care-panel.csv` with template `value-based-care-panel`.
8. Upload `service-line-pnl.csv` with template `service-line-pnl`.
9. Upload `rcm-denials.csv` with template `rcm-denials`.
10. Upload `prior-auth-workqueue.csv` with template `prior-auth-workqueue`.
11. Upload `vendor-baa-contracts.csv` with template `vendor-baa-contracts`.
12. Upload `clinical-ai-model-inventory.csv` with template `clinical-ai-model-inventory`.
13. Upload `governance-committee-decisions.csv` with template `governance-committee-decisions`.
14. Upload remaining templates as time allows, preserving their template IDs from `template-catalog.json`.

## Must-Prove Checks

- `/admin/context-layer` shows Meridian source files and nonzero chunks.
- `/admin/context-layer/uploads` lists the uploaded source documents.
- Evidence map opens for `enterprise-profile.yaml`.
- Source text includes these canonical facts:
  - Sacramento, California
  - 30 hospitals
  - 280 ambulatory sites
  - 58,000 employees
  - Epic
  - Azure Databricks lakehouse
- Pending chunks are embedded or the embedding handoff is explicitly queued.

## Post-Reload Crawl

Run the Meridian/PHS crawl only after the must-prove checks pass.

Capture:

- Setup/Admin context layer
- Uploads table
- Evidence map
- Intelligence Brief
- Intelligence Enterprise Context
- Moves command-center phase flow
- Tower/Nexus answers to at least 50 hard Meridian/PHS questions

Save screenshots under:

`docs/build/meridian-demo-walkthrough/`

Save answer captures under:

`reports/2026-06-05-meridian-phs-agent-response-capture/`

## Stop Conditions

Stop and report before proceeding if:

- Active tenant is not Meridian/PHS.
- Any upload returns cross-tenant, attestation, sensitive-upload, or persistence errors.
- Admin context remains zero after successful uploads.
- Nexus/Sentinel answers cite stale facts such as 23 hospitals, Charlotte, or non-Sacramento headquarters.
- Any output shows another client tenant's context.

## Completion Bar

The reload is complete only when live Admin context, evidence-map rows, embedded/pending chunk status, screenshots, and hard-question answer captures all agree with the Sacramento-based 30-plus hospital Meridian/PHS profile.
