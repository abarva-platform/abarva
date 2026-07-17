# V6/V7 Sunset Deletion Readiness Audit

Status: PASS for Phase 0 audit/report generation only.

Generated: 2026-07-17T02:15:01.939Z

Scope: deletion-readiness audit and phased retirement plan. No runtime code deletion, no data deletion, no historical migration edits, no Azure/Postgres mutation, no deploy, and no tenant promotion were performed.

## Current Decision

V6/V7 is not ready for broad deletion. The repository still contains active runtime, bridge/read-model, generated artifact, test, documentation, dataset, and historical migration references. Deletion must be phased and blocked until each active dependency has a V3 replacement that is implemented, merged, deployed through the approved ACA main workflow when runtime-visible, signed-in browser-proven, tenant-safe, and same-or-better on latency and quality.

The current physical V3 dataset buildout is still in progress: Meridian is the current V3 physical dataset, while SkyHarbor Air and First Capital are WIP/planned for the new V3 physical dataset.

## Totals

- Reference groups: 923
- Total line references: 9477
- Active runtime dependency groups: 39
- Bridge/read-model dependency groups: 93
- Generated artifact dependency groups: 22
- Test-only dependency groups: 50
- Historical migration groups: 6
- Safe-delete candidate groups after reference proof: 456
- Blocked/do-not-delete groups: 266

## Phase Plan

- Phase 0 - Audit only: this PR. Reports, dependency map, and release record only.
- Phase 1 - Disable dead generators and unused generated datasets only: only after reference proof shows no runtime, test, loader, or active proof-harness usage.
- Phase 2 - Runtime cutover cleanup: only after V3 replacements are implemented, merged, deployed when needed, signed-in browser-proven, tenant-safe, and same-or-better.
- Phase 3 - Forward schema retirement: only with explicit Anand approval and forward-only migrations. Historical migrations stay immutable.

## Home

- Reference groups: 56
- Total references: 518
- Active runtime dependency groups: 24
- Bridge/read-model dependency groups: 0
- Generated artifact dependency groups: 0
- Blocked delete groups: 56

### Active runtime examples

- src/app/(maestro)/home/page.tsx (v6_label, 1)
- src/app/(maestro)/home/page.tsx (v7_label, 2)
- src/app/api/home/know/ask/route.ts (v6_label, 10)
- src/app/api/home/know/ask/route.ts (v7_label, 6)
- src/app/api/home/summary-snapshot/route.ts (v6_label, 1)
- src/app/api/home/summary-snapshot/route.ts (v7_label, 1)
- src/components/home/HomeSurface.tsx (v6_label, 1)
- src/lib/home/know/home-v6-executive-synthesis.ts (v6_label, 7)

### Bridge/read-model examples

None identified.

### Safe-delete candidates after reference proof

None identified.


## Tower

- Reference groups: 31
- Total references: 210
- Active runtime dependency groups: 9
- Bridge/read-model dependency groups: 1
- Generated artifact dependency groups: 0
- Blocked delete groups: 16

### Active runtime examples

- src/app/api/tower/ask/route.ts (v6_label, 4)
- src/lib/atlas/tower-grounding.ts (v7_label, 1)
- src/lib/cio-tower/cxo-view-model.ts (v7_label, 1)
- src/lib/cio-tower/metric-packet-store.ts (intelligence_v7, 1)
- src/lib/cio-tower/metric-packet-store.ts (v7_label, 1)
- src/lib/tower/v7-tower-projection.ts (intelligence_v7, 10)
- src/lib/tower/v7-tower-projection.ts (latest_loaded_validated, 1)
- src/lib/tower/v7-tower-projection.ts (tenant_pack_runs, 1)

### Bridge/read-model examples

- scripts/lakeshore/sync-lakeshore-v6-to-tower-standardized.mjs (v6_csv, 10)

### Safe-delete candidates after reference proof

- proof/lakeshore-v7-home-tower-browser-final-20260706T202027Z/browser-proof.json (v7_label, 9)
- proof/lakeshore-v7-home-tower-browser-restored-20260706T202414Z/restored-proof.json (v7_label, 1)
- reports/candidate-module-workbench-previews/skyharbor/tower-workbench-preview.json (v6_label, 12)
- reports/candidate-module-workbench-previews/skyharbor/tower-workbench-preview.json (v6_v7_dataset, 9)
- reports/candidate-module-workbench-previews/skyharbor/tower-workbench-preview.json (v7_csv, 7)
- reports/candidate-module-workbench-previews/skyharbor/tower-workbench-preview.json (v7_label, 15)


## Intelligence

- Reference groups: 158
- Total references: 891
- Active runtime dependency groups: 4
- Bridge/read-model dependency groups: 5
- Generated artifact dependency groups: 0
- Blocked delete groups: 36

### Active runtime examples

- src/lib/intelligence/ask/retrievers/v7-dossier.ts (intelligence_v7, 7)
- src/lib/intelligence/ask/retrievers/v7-dossier.ts (latest_loaded_validated, 2)
- src/lib/intelligence/ask/retrievers/v7-dossier.ts (tenant_pack_runs, 2)
- src/lib/intelligence/ask/retrievers/v7-dossier.ts (v7_label, 70)

### Bridge/read-model examples

- scripts/audit/build-data-intelligence-redesign-report.mjs (scripts_v7, 3)
- scripts/audit/build-data-intelligence-redesign-report.mjs (tenant_pack_runs, 3)
- scripts/audit/build-data-intelligence-redesign-report.mjs (v6_label, 3)
- scripts/audit/build-data-intelligence-redesign-report.mjs (v6_v7_dataset, 1)
- scripts/audit/build-data-intelligence-redesign-report.mjs (v7_label, 6)

### Safe-delete candidates after reference proof

- proof/home-intelligence-50q-live-audit/2026-07-06T22-57-24-137Z/prompts/INT-LSH-001-prompt-reconstruction.txt (v6_label, 3)
- proof/home-intelligence-50q-live-audit/2026-07-06T22-57-24-137Z/prompts/INT-LSH-003-prompt-reconstruction.txt (v6_label, 3)
- proof/home-intelligence-50q-live-audit/2026-07-06T22-57-24-137Z/prompts/INT-LSH-004-prompt-reconstruction.txt (v6_label, 3)
- proof/home-intelligence-50q-live-audit/2026-07-06T22-57-24-137Z/prompts/INT-LSH-005-prompt-reconstruction.txt (v6_label, 3)
- proof/home-intelligence-50q-live-audit/2026-07-06T22-57-24-137Z/prompts/INT-LSH-006-prompt-reconstruction.txt (v6_label, 3)
- proof/home-intelligence-50q-live-audit/2026-07-06T22-57-24-137Z/prompts/INT-LSH-007-prompt-reconstruction.txt (v6_label, 3)
- proof/home-intelligence-50q-live-audit/2026-07-06T22-57-24-137Z/prompts/INT-LSH-008-prompt-reconstruction.txt (v6_label, 3)
- proof/home-intelligence-50q-live-audit/2026-07-06T22-57-24-137Z/prompts/INT-LSH-009-prompt-reconstruction.txt (v6_label, 3)


## Moves

- Reference groups: 14
- Total references: 49
- Active runtime dependency groups: 0
- Bridge/read-model dependency groups: 3
- Generated artifact dependency groups: 0
- Blocked delete groups: 3

### Active runtime examples

None identified.

### Bridge/read-model examples

- src/lib/enterprise-data/moves-shadow-proof/moves-shadow-proof.ts (v6_label, 2)
- src/lib/enterprise-data/moves-shadow-proof/moves-shadow-proof.ts (v6_v7_dataset, 2)
- src/lib/enterprise-data/moves-shadow-proof/moves-shadow-proof.ts (v7_label, 2)

### Safe-delete candidates after reference proof

- proof/moves-recording-readiness-fixes-2026-07-04/proof-report.md (v7_label, 1)
- reports/candidate-module-workbench-previews/skyharbor/moves-workbench-preview.json (v6_label, 5)
- reports/candidate-module-workbench-previews/skyharbor/moves-workbench-preview.json (v6_v7_dataset, 2)
- reports/candidate-module-workbench-previews/skyharbor/moves-workbench-preview.json (v7_label, 8)
- reports/moves-upload-evidence-v7-integration-audit-2026-07-04.md (v7_label, 10)


## Source

- Reference groups: 68
- Total references: 850
- Active runtime dependency groups: 1
- Bridge/read-model dependency groups: 0
- Generated artifact dependency groups: 7
- Blocked delete groups: 4

### Active runtime examples

- src/app/api/source/synthesis/route.ts (v6_label, 8)

### Bridge/read-model examples

None identified.

### Safe-delete candidates after reference proof

- reports/candidate-module-workbench-previews/skyharbor/source-workbench-preview.json (v6_label, 4)
- reports/candidate-module-workbench-previews/skyharbor/source-workbench-preview.json (v6_v7_dataset, 1)
- reports/candidate-module-workbench-previews/skyharbor/source-workbench-preview.json (v7_label, 4)
- reports/demo-readiness/meridian-data-state/source-inventory.csv (v6_label, 46)
- reports/demo-readiness/meridian-data-state/source-inventory.csv (v7_label, 3)
- reports/enterprise-profile-foundation/latest/source-lineage.json (v6_csv, 6)
- reports/enterprise-profile-foundation/latest/source-lineage.json (v6_label, 8)
- reports/enterprise-profile-foundation/latest/source-lineage.json (v6_v7_dataset, 2)


## Admin/data loaders

- Reference groups: 73
- Total references: 1585
- Active runtime dependency groups: 0
- Bridge/read-model dependency groups: 28
- Generated artifact dependency groups: 0
- Blocked delete groups: 34

### Active runtime examples

None identified.

### Bridge/read-model examples

- docs/governance/dataset-manifests/skyharbor-air-v6-v7-upgrade-candidate-20260710.json (v6_label, 3)
- docs/governance/dataset-manifests/skyharbor-air-v6-v7-upgrade-candidate-20260710.json (v6_v7_dataset, 2)
- docs/governance/dataset-manifests/skyharbor-air-v6-v7-upgrade-candidate-20260710.json (v7_label, 3)
- scripts/audit/candidate-invisibility-guard.mjs (intelligence_v7, 5)
- scripts/audit/candidate-invisibility-guard.mjs (latest_loaded_validated, 2)
- scripts/audit/candidate-invisibility-guard.mjs (tenant_pack_runs, 4)
- scripts/audit/candidate-invisibility-guard.mjs (v7_label, 11)
- scripts/knowledge/build-data-plane-load-plan.mjs (intelligence_v7, 12)

### Safe-delete candidates after reference proof

- proof/lakeshore-legal-upload-evidence-smoke-2026-07-04/proof-report.md (v7_label, 2)
- reports/admin-data-layer-explorer/latest/tenant-manifest-projection-audit.json (v6_csv, 238)
- reports/admin-data-layer-explorer/latest/tenant-manifest-projection-audit.json (v6_label, 198)
- reports/admin-data-layer-explorer/latest/tenant-manifest-projection-audit.json (v6_v7_dataset, 93)
- reports/admin-data-layer-explorer/latest/tenant-manifest-projection-audit.json (v7_csv, 444)
- reports/admin-data-layer-explorer/latest/tenant-manifest-projection-audit.json (v7_label, 276)
- reports/admin-home-design-smoke/latest/naming-audit.json (v6_label, 1)
- reports/admin-home-design-smoke/latest/naming-audit.json (v7_label, 1)


## generated CXO/story-block pipeline

- Reference groups: 50
- Total references: 307
- Active runtime dependency groups: 0
- Bridge/read-model dependency groups: 21
- Generated artifact dependency groups: 15
- Blocked delete groups: 22

### Active runtime examples

None identified.

### Bridge/read-model examples

- scripts/knowledge/audit-module-cxo-content.mjs (v6_label, 2)
- scripts/knowledge/audit-module-cxo-content.mjs (v6_v7_dataset, 1)
- scripts/knowledge/audit-module-cxo-content.mjs (v7_label, 2)
- scripts/knowledge/build-context-data-flow-report.mjs (v6_label, 7)
- scripts/knowledge/build-context-data-flow-report.mjs (v6_v7_dataset, 1)
- scripts/knowledge/build-context-data-flow-report.mjs (v7_label, 8)
- scripts/knowledge/generate-cxo-story-blocks.mjs (v6_label, 2)
- scripts/knowledge/generate-cxo-story-blocks.mjs (v6_v7_dataset, 1)

### Safe-delete candidates after reference proof

- reports/multi-tenant-cxo-story-generation/user-facing-language-scan.csv (v6_label, 3)
- reports/multi-tenant-cxo-story-generation/user-facing-language-scan.csv (v7_label, 3)


## Required Files

- reports/v6-v7-sunset/dependency-map.json
- reports/v6-v7-sunset/safe-delete-candidates.csv
- reports/v6-v7-sunset/blocked-delete-candidates.csv
- reports/v6-v7-sunset/runtime-dependencies.csv
- reports/v6-v7-sunset/replacement-required.csv

## Guardrail

This audit is not approval to delete V6/V7 runtime code, datasets, schemas, or migrations. It is a control-plane readiness map for deciding what can be retired after V3 proof boundaries are satisfied.
