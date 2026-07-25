# 2026-07-25-roadmap-pr4-presentation-contract — PR4: shared renderer-neutral roadmap contract

## Release ID

`2026-07-25-roadmap-pr4-presentation-contract`

## Status

`candidate`

## Plain-English Summary

PR4 of the roadmap governed-artifact-synchronization series. Defines the **single, renderer-neutral
roadmap presentation contract** so HTML (preview), DOCX (detail) and PPTX (executive deck) can never
become independently generated versions of the roadmap — they all render from one structured object
carrying the same executive conclusion, sponsor decision, horizons + outcomes, decision gates, value
milestones, dependencies, evidence statuses, governance (lifecycle) state, risks, caveats, lineage
and appendix detail.

Every output will stamp the contract **version** and a **deterministic content hash**, so the three
formats can be proven (PR7) to derive from the same source. No renderers are built here — this is the
data contract they consume.

## Layer Impact

- **global-control-lane**: shared roadmap data contract for all renderers, every tenant.

## Client Applicability

- All clients: yes (once PR5/PR6 renderers consume it).

## Changes Included

- `src/lib/deliverables/roadmap-presentation-contract.ts` — `ROADMAP_CONTRACT_VERSION`,
  `RoadmapEvidenceStatus`, the contract types (`RoadmapHorizon`, `RoadmapDecisionGate`,
  `RoadmapValueMilestone`, `RoadmapDependency`, `RoadmapWorkstreamItem`, `RoadmapLineage`,
  `RoadmapPresentationContract`), `roadmapContentHash` (order-independent canonical sha256),
  `buildRoadmapPresentationContract` (stamps version + derived hash), `roadmapContractStamp`. Imports
  the canonical `RoadmapLifecycleState` from the PR2 lifecycle module (no duplication).
- Tests: `roadmap-presentation-contract.test.ts` — version + hash stamped; deterministic;
  order-independent; hash changes on any content change; hash changes on lifecycle-state change;
  stamp carries version + hash; hash excludes the hash field.

## QA / Validation

- `npx jest` — 7/7 pass.
- `npx eslint` — clean.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — pass.
- Live signed-in proof — via PR7 once PPTX/DOCX/HTML all render from this contract.

## Rollout Plan

Squash-merge to `main`; repo-owned `aca-main-deploy.yml` deploys. No flag, no migration. (Type/util
only — no runtime behavior change until PR5/PR6 wire the renderers.)

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy.
- Live signed-in proof required: covered by PR7.

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened. PR4 of the series (PR1 #5613, PR2 #5615, PR3 #5616).

## Known Gaps

The roadmap pilot stays OPEN. This PR is the contract only; the renderers that consume it are PR5
(editable PPTX via pptxgenjs), PR6 (editable DOCX + synchronized HTML), and the extraction that
builds the contract from a generated roadmap lands with PR5/6. PR7 is the cross-format +
application-level proof. Closure language stays: **story-first renderer proven; governed-artifact
synchronization, executive packaging and editable PPTX delivery remain open.**
