# 2026-09-25-moves-p1-charter-evidence-binding — Bind current P1 Charter fields

## Release ID

`2026-09-25-moves-p1-charter-evidence-binding`

## Status

`candidate`

## Plain-English Summary

This release fixes the evidence-binding seam for generated Moves Program Charter artifacts. The
P1 Charter generator now reads the current phase-capture fields for sponsor commitment, scope
boundary, success criteria, stakeholder map, decision rights, and the P2 evidence plan, while still
supporting the older charter field names used by existing records.

The change prevents a generated Program Charter from treating completed P1 inputs as open items
only because the generator looked for stale field keys.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Updates Moves generated-artifact request assembly and tests. No tenant intake,
  source adapter, canonical model, data-plane, migration, or product projection data is changed.

## Client Applicability

- All clients: Applies to Moves Program Charter generation wherever orchestrated deliverables are
  enabled.
- Specific clients: None.
- Internal only: None.
- Public/demo only: Not specific to public demo flows.
- Feature flag: Uses the existing generated-deliverable path; no new flag is introduced.

## Changes Included

- Adds current P1 Charter field aliases to the Move deliverable request builder:
  `sponsor_commitment`, `scope_boundary`, `success_criteria`, `stakeholder_map`,
  `decision_rights`, and `evidence_plan`.
- Preserves legacy fields such as `sponsor`, `stakeholders`, `success_metrics`, `scope`, and
  optional `value_range` for older Move records.
- Makes `decision_rights` and `evidence_plan` required only for Program Charter generation, not
  for later business-case artifacts.
- Treats `program_charter` like `charter` for required evidence-signal selection so the P1 Charter
  does not inherit unrelated generic metric-signal requirements.
- Adds regression coverage for a current P1 Program Charter payload.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/programs/deliverables/orchestrated/__tests__/orchestrated-business-case.test.ts --runInBand` — 12/12 tests passed.
- Pass: `npm test -- --runTestsByPath src/lib/programs/deliverables/orchestrated/__tests__/quality-bar-wiring.test.ts src/lib/programs/deliverables/__tests__/deliverable-quality.test.ts --runInBand` — 23/23 tests passed.
- Pass: `npm run typecheck` — clean.

## Rollout Plan

Merge through a pull request. The repo-owned ACA main deploy workflow may rebuild the runtime after
merge; no separate data build, migration, feature flag, registry activation, or data-plane load is
required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed if triggered by merge to main.
- Shared runtime mutators: None.
- Approved image digest: Not applicable until the repo-owned deploy workflow builds an image.
- ACA runtime invariant: Standard post-deploy invariant if a web deploy is triggered.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: A signed-in Moves Program Charter regeneration smoke should be run
  after deploy before claiming the artifact quality issue is closed.

## Rollback Plan

Revert the PR. Rollback restores the prior field mapping. No migration rollback is required.

## Audit Evidence

- PR and CI evidence to be attached when opened.
- Local validation commands listed in this record.

## Known Gaps

This release fixes request evidence binding. It does not add document upload automation, client
file-ingestion changes, P1 inherited review cards, or a new human-quality exemplar set.
