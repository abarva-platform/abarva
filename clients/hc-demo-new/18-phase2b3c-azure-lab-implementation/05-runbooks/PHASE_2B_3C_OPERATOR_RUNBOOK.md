# Phase 2B-3C Operator Runbook

## Before any Azure action

1. Confirm tenant key is exactly `hc-demo-new`.
2. Confirm database target is exactly `pg-abarva-hc-demo-new-lab-eus-001/abarva_hc_demo_new_knowledge_lab`.
3. Confirm storage target is exactly `stabhcdemonewlab001/hc-demo-new/`.
4. Confirm resource group, VNet, subnet, Container Apps environment and Log Analytics workspace are approved in the manifest.
5. Confirm hidden truth and restricted crosswalk assets are uploaded to evaluator-only restricted locations, not parser/model-visible raw locations.

## Vertical slice sequence

1. Land Patient Access subset into private raw storage.
2. Register sources and immutable versions.
3. Parse source artifacts into evidence candidates.
4. Normalize values and create candidates.
5. Resolve identities and relationships.
6. Validate semantics and detect conflicts.
7. Route review/quarantine.
8. Accept/reject only from review output.
9. Publish domain baseline.
10. Build module projections and Home read model.
11. Run reconstruction scorecard against evaluator-only truth.
12. Produce case-study evidence.

## Full corpus

Run the exact same job sequence. Do not introduce a second ingestion path for the full corpus.
