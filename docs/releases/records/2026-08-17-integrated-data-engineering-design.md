# 2026-08-17-integrated-data-engineering-design - Integrated Data Engineering Design

## Release ID

`2026-08-17-integrated-data-engineering-design`

## Status

`candidate`

## Plain-English Summary

Adds a detailed review-candidate architecture document for the integrated data-engineering design.
The document separates the governed medallion layers, operational application layers, and aVa/RAG
readiness layers so future implementation work does not confuse product adapters with canonical
enterprise integration.

## Layer Impact

Release lane: `internal-admin`.

- Layer 1: Documents intake inventory, file classification, packet quality, and manifest duties.
- Layer 2: Documents adapter inputs, outputs, quarantine behavior, and non-responsibilities.
- Layer 3: Documents canonical entity resolution, source mentions, fact authority, reference
  resolution, and graph quality.
- Layer 4: Documents product marts, cubes, workflow stores, read models, build provenance, and
  readback requirements.
- aVa/RAG: Documents governed object readiness, indexing, retrieval, citation proof, and
  agent-ready state separation.

## Client Applicability

- All clients: Design applies to the shared data engineering model.
- Specific clients: None.
- Internal only: Architecture and review workflow.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/integrated-data-engineering-design.md`
- `docs/architecture/integrated-data-engineering-design.html`
- `docs/architecture/README.md`
- `docs/releases/records/2026-08-17-integrated-data-engineering-design.md`

## QA / Validation

- `npm run release:check`: passed.
- `git diff --check`: passed.
- Static HTML sanity check: passed. The generated file has the expected doctype, title, table of
  contents, Mermaid rendering hook, and review checklist content.
- `not run`: Review by a second engineering agent against repository code paths is pending.

## Rollout Plan

Merge to main through the normal PR path. This is documentation only and does not require a data
load, migration, registry activation, index refresh, feature flag, or product runtime rollout.

## Deployment Authority

- Repo-owned deploy workflow: If merged to main, the standard workflow may rebuild the web image,
  but the change is documentation-only.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable to the design content.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the documentation PR if the design is rejected or superseded.

## Audit Evidence

- Pull request URL once opened.
- Local validation output.
- Second-review notes from Claude Code or another reviewer.

## Known Gaps

- This record does not claim implementation compliance. It publishes the design and review
  checklist needed to prevent further rework.
