# 2026-07-06-source-top10-archetype-playbooks — Five new sourcing archetypes complete the top-10 playbook

## Release ID

`2026-07-06-source-top10-archetype-playbooks`

## Status

`candidate`

## Plain-English Summary

Adds five new sourcing-archetype playbooks, taking the archetype registry from 5 to
**10** and completing the "top-10 outsourcing archetypes" coverage. Each is authored to
the AMS quality bar — practical, event-type-specific commercial intelligence (required
evidence, vendor-challenge guide, RFP structure, pricing model + traps, evaluation
weights + disqualifiers, risk model, timed negotiation levers, deliverable pack, gate
criteria, stage model), not generic prose. Because the archetype advisory is already
wired into the deliverable prompts (d01/d09/d11/d24), events of these types now
immediately carry their specific traps and levers instead of a generic voice.

The five:
- **BPO Shared Services** (transaction BPO across HR / Finance-F&A / Supply Chain) — volume-band pricing, error/rework economics, automation gainshare, SOX/SoD controls, retained-cost.
- **Cyber / MSSP / SOC** — the "monitoring vs accountable detection AND response" line, SIEM/SOAR/EDR tooling-ownership lock-in, MTTD/MTTR-by-severity remedies.
- **Staff Augmentation / Contractor Labor** — rate-card compression, tenure/co-employment, markup transparency, location-mix arbitrage.
- **Digital Product Engineering** — pod-vs-staff-aug, named-team lock + proof tasks, velocity/quality SLAs, IP/repo/no-reuse.
- **Contact Center / CX** — buy outcomes (CSAT/FCR/containment), not seats and minutes; deflection credits.

## Layer Impact

- `global-control-lane`: shared Source behavior for all clients. Adds 5 `SourceEventArchetype`
  entries to the registry (code constants), one new classifier category `bpo_shared_services`
  (union + taxonomy definition + keywords + default motion + delivery model), 9 supporting
  method-library specs, and 5 resolver mappings (`bpo_shared_services→BPO_SHARED_SERVICES`,
  `cyber_grc→MSSP_CYBER`, `staff_aug_vs_managed_service→STAFF_AUGMENTATION`,
  `ai_engineering_partner→DIGITAL_PRODUCT_ENGINEERING`, `bpo_contact_centre→CONTACT_CENTER_CX`
  — all previously null). No data, schema, seed, or migration.

## Client Applicability

- All clients: yes (any event classified into one of the five categories)
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/source/archetypes/registry.ts` — 5 new archetype consts + registry entries.
- `src/lib/source/archetypes/event-archetype-resolver.ts` — 5 category→archetype mappings.
- `src/lib/source/archetypes/method-library.ts` — 9 method specs the new stageModels reference
  (staffing_model, pod_sizing, velocity_sla, quality_gap, rate_normalization, role_normalization,
  tenure_analysis, location_mix_analysis, utilization_analysis).
- `src/lib/source/taxonomy/category-taxonomy.ts` — new `bpo_shared_services` category id + full
  `SourceCategoryDefinition` + taxonomy map entry.
- `src/lib/source/classifier/category-classifier.ts` — `bpo_shared_services` keywords + default motion.
- `src/lib/source/delivery-model/delivery-model-gate.ts` — `bpo_shared_services` default model.
- Tests updated to the new reality: taxonomy length 8→9, differentiation 10-archetype set,
  resolver ready-categories set + newly-mapped-category assertions, classifier BPO coverage case.

## QA / Validation

- Registry runtime check → **10 archetypes** registered. **pass.**
- `npx jest src/lib/source/{archetypes,classifier,taxonomy,delivery-model}` → **10 suites / 179
  tests pass**. **pass.**
- `npx tsc --noEmit` (full project, to completion, exit-code gated) → **0 source errors**. **pass.**
- `npx eslint` on all changed files → clean. **pass.**
- Not live-proven: an event of each type carrying its archetype advisory in a real generated
  deliverable needs a signed-in walkthrough (folded into archetype QA). **verify on deploy.**

## Rollout Plan

Merge to `main` via PR + squash. ACA main deploy auto-runs on merge; record the revision. No
migration, no feature flag.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md` (auto-runs on merge to main).
- Shared runtime mutators: none — archetype registry / taxonomy / classifier / method-library
  constants only. No worker jobs, DNS, or env mutation.
- Approved image digest: recorded on deploy.
- ACA runtime invariant: new revision healthy before 100% traffic; single deploy authority.
- Worker image invariant: n/a.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — verify an event in each new category resolves its
  archetype and carries the archetype traps/levers on `app.abarva.ai`.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. Removing the 5 archetypes, the new category,
and the resolver mappings returns those event types to generic advisor voice with no data effect.
No schema/migration to unwind.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint.
- `resolveArchetypeForEvent` returns an auditable `reason` for every resolution.

## Known Gaps

- The `ValueLeverRule` layer (structured trigger-logic + value-basis lever that turns each
  archetype's traps into computable value rows) is the next workstream — this slice ships the
  qualitative playbooks; the quantified value number comes next.
- An ERP managed-services variant (distinct from the existing ERP_SI implementation archetype)
  is a possible future addition; the top-10 coverage treats ERP via ERP_SI for now.
