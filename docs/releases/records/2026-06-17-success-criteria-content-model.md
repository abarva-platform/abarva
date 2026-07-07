# 2026-06-17-success-criteria-content-model — Success-criteria content model

## Release ID

`2026-06-17-success-criteria-content-model`

## Status

`candidate`

## Plain-English Summary

Makes "success criteria" a real, four-part commitment in the deliverables that define
the **use case** (P1 Charter) and the **solution** (P3), instead of a single value
number.

When we define a use case and a solution we must understand and document: (1) the
**business outcomes** the move must produce; (2) the **key metrics** that prove each
outcome, each with a baseline and a target; (3) **how the client will measure** each
metric *after* deployment — data source, owner, cadence, and the enablement needed to
capture it; and (4) **whether and how the client will change their business process**
to enable the outcome (technology alone rarely delivers it). Parts (3) and (4) are
commitments, so they also belong to **change readiness** and **sponsor commitment** —
the sponsor commits not only to funding the technology but to driving the process
change and owning the measurement.

This threads through the deliverable arc: the charter states the criteria as a
hypothesis; discovery validates the baselines and the client's readiness to change;
the operating-model designs the concrete to-be business-process changes; the value
model operationalises the measurement plan. The canonical definition is captured in a
new standard doc.

## Layer Impact

- `global-control-lane`: shared deliverable-generation content contract. Strengthens
  the section intents (and one section key rename: charter `value_hypothesis` →
  `success_criteria`) in the Moves deliverable structures. No schema, data-plane, or
  runtime-dependency change — it changes what the generators are instructed to produce.

## Client Applicability

- All clients: yes — every newly generated Moves charter / discovery / operating-model
  / value-model follows the strengthened contract.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none. (Affects deliverables generated after ship; existing ones
  unchanged until re-run.)

## Changes Included

- `docs/strategy/SUCCESS-CRITERIA-STANDARD.md` (new) — the canonical four-part model
  and how it threads charter → discovery → solution → value, tied to change-readiness
  and sponsorship.
- `briefs/deliverable-structures.ts`:
  - charter — `value_hypothesis` → `success_criteria` ("Success Criteria, Value
    Hypothesis & Measurement") requiring all four parts; `sponsor_commitment` →
    "Sponsor Commitment & Change Readiness" requiring commitment to drive the process
    change and own the measurement.
  - discovery_report `readiness` — validate baselines + ability/willingness to change.
  - operating_model `change` — the concrete to-be business-process changes that enable
    each outcome + the metric enablement.
  - value_model `measurement_model` — the operational post-deployment measurement plan
    (data source, owner, cadence, enablement) tied to each outcome.
- `__tests__/generation-plan.test.ts` — charter key updated; +1 test asserting the
  four-part success-criteria model and change-ready sponsorship.

## QA / Validation

- `npx tsc --noEmit` on changed files — **PASS** (no new errors).
- `npx eslint` on changed files — **PASS** (exit 0).
- `npx jest src/lib/deliverables/orchestrator` — **PASS** (13 suites, 101 tests, +1 new).
- Live charter regen showing the success-criteria section covering outcomes + metrics
  + post-deployment measurement + process-change commitment — **NOT-RUN** at authoring;
  runs post-deploy.

## Rollout Plan

Squash → main. `az acr build` → deploy the worker job (runs the generator) + a web
revision → traffic shift → deactivate idle revisions. No migration, no flag.

## Rollback Plan

Revert the squash-merge and redeploy the prior image to the worker job + web. No
data/schema change; previously generated deliverables are unaffected.

## Audit Evidence

- PR URL (filled at PR open); `jest`/`tsc`/`eslint` output in the PR.
- Post-deploy: a regenerated charter's `success_criteria` section content.

## Known Gaps

- The P4 business case keeps its own `value_hypothesis` (quantified benefits) — tying
  its benefits explicitly back to the success metrics is a follow-up.
- The model is expressed as generation-contract section intents; a typed
  `SuccessCriteria` object in the context-binding layer (with per-metric measurement
  provenance) is the larger follow-up in [[project_deliverable_system_design]].
