# 2026-06-12-docgen-discovery-plan — Discovery Plan deliverable (archetype-driven evidence-request + interview guide)

## Release ID

`2026-06-12-docgen-discovery-plan`

## Status

`candidate`

## Plain-English Summary

Adds the **Discovery Plan** (Evidence Request Pack) as a first-class deliverable
type in the document-generation engine. It answers the gap that the P1→P2
(Charter → Discover) transition opened a blank upload box: a real client doesn't
know _what_ evidence is relevant or _who_ to interview. The Discovery Plan
prescribes both — an **Evidence Request List** (each family with why-it-matters,
required/optional, likely source, format, owner role, status) and an **Interview
Guide** spanning **business and IT** with tailored questions — driven by the
use-case **archetype** and the approved Charter (so it doesn't re-ask known
facts and stays scoped, not an exhaustive IT audit).

This is **PR-i** of the discovery-plan spec: the deliverable type, the archetype
blueprint catalog, the brief, and the policy tier. The P1→P2 auto-trigger
(PR-ii) and the upload→family→gap-register loop (PR-iii) follow.

## Layer Impact

- `global-control-lane`: new `briefs/discovery-blueprint.ts` (archetype evidence
  families + interview roster); `artifact-brief-registry.ts` builds a dedicated
  `discovery_plan` brief from the blueprint; `document-generation-policy.ts`
  registers `discovery_plan` / `evidence_request_pack` as Tier 3. No schema/API
  change; no runtime trigger yet (the deliverable is resolvable, not yet
  auto-generated).

## Client Applicability

- All clients; archetype-driven (AI-Operations / customer-digital catalog seeded;
  generic default for other archetypes). Feature flag: none.

## Changes Included

- `briefs/discovery-blueprint.ts` (NEW): `EvidenceFamily` / `InterviewRole` /
  `DiscoveryBlueprint`; AI-Operations blueprint (12 families, 11 roles incl. the
  real-time-data/CDP IT questions) + generic default; `getDiscoveryBlueprint`
  (ops tokens → AI-Operations).
- `artifact-brief-registry.ts`: `buildDiscoveryPlanBrief` + resolver special-case
  for `discovery_plan` / `evidence_request_pack`.
- `document-generation-policy.ts`: register the two deliverable keys as Tier 3.
- Tests: `__tests__/discovery-plan.test.ts` (blueprint resolution incl. business
  - IT tracks and the data-estate question; dedicated brief with the required
    sections + request/interview tables; catalog embedded in section intents;
    policy tier).

## QA / Validation

- `tsc` clean; `eslint` clean; full orchestrator + AI suites pass (11 suites,
  73 tests incl. the new discovery-plan tests).

## Rollout Plan

Merge and deploy. The deliverable type is resolvable now; generating it requires
the orchestrator to be invoked for `discovery_plan` (PR-ii adds the P1→P2
trigger). No migration.

## Rollback Plan

Revert the three files; additive and inert until invoked.

## Audit Evidence

- Branch: `feat/docgen-discovery-plan`. Spec:
  `~/Downloads/SkyHarbor_IROPS_Care_DiscoveryPlan/SPEC_discovery_plan_deliverable.md`
  (a generated SkyHarbor example accompanies it).

## Known Gaps

- **PR-ii** (auto-generate the Discovery Plan on Charter approval + surface in the
  Move/File Cabinet) and **PR-iii** (map uploads → evidence families → auto-derive
  the gap register + readiness score) are not in this slice.
- Blueprint catalogs beyond AI-Operations + the generic default should be filled
  in per archetype as use cases are onboarded (data, not code).
