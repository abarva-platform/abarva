# 2026-06-16-ai-control-tower-template — AI Control Tower Monthly Refresh Template

## Release ID

`2026-06-16-ai-control-tower-template`

## Status

`candidate`

## Plain-English Summary

Added a client-replicable AI Control Tower monthly refresh Excel workbook and companion data-model / load-contract documentation. The package provides a governance-ready template covering AI initiatives, usage metrics, spend, persona productivity, DORA metrics, ServiceNow agents, ERP/HCM/finance agents, benefit realization, governance risk, evidence artifacts, and refresh logs — scoped by `client_id` so it applies across all tenants. This is documentation and a template artifact only; no runtime code, schema migration, or live data-plane commit is included.

## Layer Impact

- `public-demo` / documentation only: workbook under `public/templates/tower/ai-control-tower/` and companion docs under `docs/build/ai-control-tower-template/`. No runtime code, schema migration, loader mutation, or live data-plane commit.

## Client Applicability

- All clients: the template is generic and designed for all tenants (Apex, First Capital, SkyHarbor, Meridian, Lakeshore, and future) via `client_id` scoping.
- Feature flag: none required; artifact is a downloadable template, not a runtime surface.

## Changes Included

- `docs/build/ai-control-tower-template/AI_Control_Tower_Monthly_Refresh_Template_v1.xlsx` — primary workbook artifact
- `public/templates/tower/ai-control-tower/AI_Control_Tower_Monthly_Refresh_Template_v1.xlsx` — public download path
- `docs/build/ai-control-tower-template/ai-control-tower-synthetic-canonical-v1.json` — canonical JSON parse target
- `docs/build/ai-control-tower-template/AI_CONTROL_TOWER_DATA_MODEL.md` — data model documentation
- `docs/build/ai-control-tower-template/AI_CONTROL_TOWER_PARSE_LOAD_CONTRACT.md` — parse/load contract for the ingestion path

## QA / Validation

Status: PASS (artifact inspection) / NOT-RUN (live ingestion path)

- PASS: Generated the workbook with the bundled spreadsheet artifact runtime; inspected the Executive Readout range; scanned for formula error markers; rendered a preview PNG; exported the workbook to both docs and public template paths; emitted a canonical JSON parse target.
- NOT-RUN: Live ingestion through Admin loader — parse/load contract is the specification; no live data-plane commit executed.

## Rollout Plan

Expose the workbook under the Tower template download surface after product wiring. Use the parse/load contract before any live client data-plane load. No migration required — this is a static artifact and documentation.


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Remove the new `public/templates/tower/ai-control-tower/` workbook and the corresponding docs under `docs/build/ai-control-tower-template/`. No DB rollback needed (no data written).

## Audit Evidence

- `docs/build/ai-control-tower-template/AI_Control_Tower_Monthly_Refresh_Template_v1.xlsx`
- `public/templates/tower/ai-control-tower/AI_Control_Tower_Monthly_Refresh_Template_v1.xlsx`
- `docs/build/ai-control-tower-template/ai-control-tower-synthetic-canonical-v1.json`
- `docs/build/ai-control-tower-template/AI_CONTROL_TOWER_DATA_MODEL.md`
- `docs/build/ai-control-tower-template/AI_CONTROL_TOWER_PARSE_LOAD_CONTRACT.md`

## Known Gaps

- Live ingestion path not yet wired to Admin loader — the parse/load contract defines it but the route doesn't implement XLSX parsing yet
- Tower template download surface not yet exposed in UI (wiring deferred)
