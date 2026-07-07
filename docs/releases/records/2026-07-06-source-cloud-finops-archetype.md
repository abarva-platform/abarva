# 2026-07-06-source-cloud-finops-archetype — Cloud / Infrastructure / FinOps sourcing archetype

## Release ID

`2026-07-06-source-cloud-finops-archetype`

## Status

`candidate`

## Plain-English Summary

Adds the **Cloud / Infrastructure / FinOps** sourcing archetype to the (previously
4-archetype) playbook and routes cloud events to it. The `cloud_finops` classifier
category already existed but had no archetype, so cloud events fell back to generic
advisor prose. Now a cloud/infrastructure/FinOps event carries its own commercial
intelligence — pricing traps (marked-up pass-through hidden in a blended rate,
utilization/reserved-capacity waste not repriced, optimization "advice" without
committed credits, vendor-owned commitment arbitrage, duplicate tooling), FinOps-timed
negotiation levers, vendor assumptions to challenge, evaluation disqualifiers, required
evidence (billing/usage export, utilization telemetry, commitment inventory), RFP
structure, and deliverable pack — through the same wiring already live for AMS.

This is one of the "top-10 outsourcing archetypes"; it takes the shipped playbook from
4 to 5 (AMS, ERP/SI, Data/AI, Renewal, + Cloud/FinOps).

## Layer Impact

- `global-control-lane`: shared Source behavior for all clients. Adds a new
  `SourceEventArchetype` (`CLOUD_FINOPS`) to the archetype registry (code constants) and
  maps `cloud_finops → CLOUD_FINOPS` in the resolver, so cloud events now get
  archetype-specific advisory in every deliverable prompt. No data, schema, seed, or
  migration; no new classifier category (the category already existed).

## Client Applicability

- All clients: yes (any event classified `cloud_finops`)
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/source/archetypes/registry.ts` — new `CLOUD_FINOPS` archetype (authored to the
  AMS quality bar: evidence families, vendor guide, RFP structure, pricing model + traps,
  evaluation model + disqualifiers, risk model, timed negotiation levers, deliverable pack,
  gate criteria, agent guidance, stage model) + registered in `SOURCE_ARCHETYPE_REGISTRY`.
- `src/lib/source/archetypes/event-archetype-resolver.ts` — `cloud_finops` now resolves to
  `CLOUD_FINOPS` (was `null`).
- Tests: `event-archetype-resolver.test.ts` + `differentiation.test.ts` updated to the
  new shipped-archetype set (5).

## QA / Validation

- Archetype + classifier suites → **8 suites / 89 tests pass**. **pass.**
- `npx tsc --noEmit` (full project, to completion, exit-code gated) → **0 source errors**.
  **pass.**
- `npx eslint` on changed files → clean. **pass.**
- Not live-proven: a real cloud event's deliverable carrying CLOUD_FINOPS advisory needs a
  signed-in walkthrough (folded into archetype QA). **verify on deploy.**

## Rollout Plan

Merge to `main` via PR + squash. ACA main deploy auto-runs on merge; record the revision.
No migration, no feature flag.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md` (auto-runs on merge to main).
- Shared runtime mutators: none — archetype registry + resolver constants only.
- Approved image digest: recorded on deploy.
- ACA runtime invariant: new revision healthy before 100% traffic; single deploy authority.
- Worker image invariant: n/a.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — verify a `cloud_finops` event's d09 carries the
  cloud pricing traps on `app.abarva.ai`.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. Removing `CLOUD_FINOPS` + reverting the
resolver mapping returns cloud events to generic advisor voice with no data effect. No
schema/migration to unwind.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint.
- `resolveArchetypeForEvent` returns an auditable `reason` for the mapping.

## Known Gaps

- Remaining top-10 archetypes still to author: BPO Shared Services (+ categories),
  Cyber/MSSP, Staff Aug, Digital Product Engineering, Contact Center/CX, and an ERP
  managed-services variant — the ongoing content pass.
- The `ValueLeverRule` layer (structured lever with triggerLogic + valueBasis that turns
  archetype traps into computable value rows) is not yet added — the next workstream that
  unifies advisor insight with the quantified value number.
