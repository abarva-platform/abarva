# 2026-08-22-moves-document-final-artifact-contract — Moves Final Artifact Format Contract

## Release ID

`2026-08-22-moves-document-final-artifact-contract`

## Status

`candidate`

## Plain-English Summary

Moves generated deliverables now treat DOCX and PPTX as the client-final artifact formats. HTML remains available as a browser preview for review, but it is labelled as preview-only and is not eligible for final client approval.

The architecture and solution prompts now ask for story-led executive artifacts that use appropriate consulting and architecture frameworks as decision lenses, so generated artifacts read as a coherent current-state-to-target-state argument rather than a bundle of unrelated sections.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 / Products: Moves artifact generation, file-cabinet labeling, and artifact download behavior are updated. No canonical data model, source adapter, registry, or tenant input mutation is included.

## Client Applicability

- All clients: Applies to Moves generated deliverables when the updated code is deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Moves generated-deliverable path; no new flag is introduced.

## Changes Included

- Moves file cabinet distinguishes client-final DOCX/PPTX artifacts from HTML previews.
- Generated artifact opening requests HTML preview; generated artifact download keeps the prescribed final format.
- Target architecture, solution approach, and solution design profiles default to PPTX finals rather than HTML finals.
- Architecture preview rendering includes a preview-only banner and strips internal decision/hash tokens from client-visible provenance notes.
- Executive story prompts include framework anchors such as current-state journey/value-stream, SWOT where useful, MECE issue tree, option matrix, capability map, RACI/decision-rights, value tree, risk-control, and implementation-wave framing.

## QA / Validation

- Pass: Focused Jest tests for file-cabinet labels, profile registry defaults, artifact persistence, quality gates, architecture prompt framing, architecture HTML preview handling, and executive story contract prompts.
- Pass: ESLint on touched source and test files.
- Pass: TypeScript `tsc --noEmit`.
- In progress: `npm run release:check`.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow may rebuild the web image after merge. No migration, data-plane load, tenant mutation, feature flag update, or registry activation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Allowed if triggered by merge to `main`.
- Shared runtime mutators: None.
- Approved image digest: Produced by the repo-owned deploy workflow if deployed.
- ACA runtime invariant: Required before claiming the change is live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Required before claiming the Moves file-cabinet and artifact behavior is live-proven.

## Rollback Plan

Revert the PR and allow the repo-owned deploy workflow to restore the prior runtime image. Existing generated artifacts remain immutable; regenerated artifacts after rollback would follow the prior format defaults and labels.

## Audit Evidence

To be filled after validation and PR/deploy:

- PR:
- Commit:
- Validation:
- Deploy:
- Runtime proof:

## Known Gaps

This release changes the artifact contract, prompt framing, preview labelling, and download behavior. It does not itself regenerate existing artifacts or approve any phase gate.
