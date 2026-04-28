# MW6 · SME Recommendation Panel

Slice ID: MW6
Slice name: SME Recommendation Panel
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Recommends AbarVa and client SMEs for the next workshop in a program.
Composes (workshop type, evidence gaps, failure modes, solution
archetype, program phase) into a stable shortlist of role-anchored
recommendations the Client Maestro can use to staff the room.
**No model calls, no calendar/booking integration, no live SME
directory lookup, no real person names, no migrations, no auth.**

## What changed

- New module
  [src/lib/programs/sme-recommendations.ts](../../../src/lib/programs/sme-recommendations.ts):
  - Public types: `SmeRole`, `SmeParticipationMode`, `SmeReadiness`,
    `SmeRecommendationReason`, `SmeRecommendation`,
    `SmeRecommendationSummary`.
  - Public helpers:
    - `buildSmeRecommendationsForWorkshop(workshop)` — builds the
      role-anchored shortlist for a given workshop readiness record;
      always names the Client Maestro and AbarVa Maestro and adds
      workshop-type-specific roles (workflow_owner, value_lead,
      data_architect, security_governance_lead, solution_architect,
      change_adoption_lead, vendor_startup_expert, domain_sme).
    - `buildSmeRecommendationsForProgram(tenant, program)` — picks
      the program's next-recommended workshop and emits
      program-level recommendations with the workshop linkage
      dropped (deterministic).
    - `summarizeSmeRecommendations(recommendations)` — aggregates
      counts that reconcile to `totalCount` across role,
      participation mode, readiness, and organization.
  - Re-exports: `SME_ROLES_IN_ORDER`,
    `SME_PARTICIPATION_MODES_IN_ORDER`, `SME_READINESS_IN_ORDER`.

- New component
  [src/components/programs/SmeRecommendationPanel.tsx](../../../src/components/programs/SmeRecommendationPanel.tsx):
  - **Server Component** (no `'use client'`, no React hooks).
  - Props: `recommendations?`, `summary?`, `workshopTitle?`,
    `programLabel?` — accepts the recommendation list and/or the
    summary, plus an optional workshop title and program label for
    the header.
  - Renders: per-recommendation row with role label, organization
    chip, participation-mode tag, readiness tag, why-needed prose,
    workshop linkage (when present), evidence/value/governance
    reason block (evidence gap, failure mode, archetype anchor,
    phase rationale), suggested-focus bullets.
  - Caption: `Source · deterministic SME recommendation seed ·
    roles only, no live directory`.
  - Calm UI — no decorative emoji, no heavy borders, no client
    interactivity.

- New tests
  [src/__tests__/integration/programs/sme-recommendation-panel.test.ts](../../../src/__tests__/integration/programs/sme-recommendation-panel.test.ts):
  Deterministic tests covering determinism per workshop and per
  program, full required field set per recommendation, roles
  unique within a workshop set, workshop-specific recommendations
  differ from program-level recommendations on linkage fields and
  ids, recommendation roster differs across workshops within a
  single program (≥2 distinct rosters), reason composition
  invariants (≥1 evidence-anchored reason, ≥1 failure-mode-anchored
  reason per workshop set), no-fabrication invariants (no real
  person-name tokens, no dollar amounts, no real `E-###`
  citations), summary reconciliation across role / participation
  mode / readiness, and module hygiene on both `.ts` and `.tsx`
  source files (no `'use client'`, no React hooks, no
  `Date.now` / `Math.random` / `new Date` / `fetch`, no Source UI /
  Sentinel / Atlas / Nexus / Agent runtime / auth / supabase /
  programs mock imports, no Claude / OpenAI / Pinecone runtime
  references).

## How it consumes MW2 + PF1 + SOL3

- The MW2 workshop readiness shape supplies workshop type,
  evidence-to-capture entries, and the deterministic id we anchor
  recommendation ids on.
- The PF1 AI program failure modes pack supplies the canonical
  failure-mode key per workshop type (`poor_use_case_framing`,
  `weak_data_foundation`, `no_measurable_baseline`,
  `missing_governance_risk`, `tool_first_thinking`,
  `no_operating_model_for_scale`, `no_adoption_change_plan`,
  `no_value_ledger`).
- The SOL3 archetype label is sourced from the program code prefix
  (ST / WA / PM / AP / OO) and rendered as a calm caption — no live
  archetype-registry lookup is required.

## Workshop-type → role roster

Every roster always names the Client Maestro and AbarVa Maestro;
phase-specific roles round out the recommendation set:

| Workshop type | Phase-specific roles |
|---|---|
| current_state_discovery | workflow_owner, domain_sme |
| use_case_framing | value_lead, workflow_owner, domain_sme |
| data_foundation_assessment | data_architect, workflow_owner |
| value_framing | value_lead, workflow_owner |
| governance_risk_review | security_governance_lead, data_architect |
| architecture_solution_design | solution_architect, vendor_startup_expert, data_architect |
| operating_model_alignment | workflow_owner, change_adoption_lead |
| adoption_change_readiness | change_adoption_lead, workflow_owner |
| executive_decision_review | value_lead, security_governance_lead |

## Deterministic invariants (test enforced)

- Same input → identical output across repeated calls for every
  workshop and every program.
- Every workshop emits ≥3 SME recommendations including the
  Client Maestro and the AbarVa Maestro.
- Every program emits ≥2 SME recommendations.
- Recommendation ids are unique within a single workshop set.
- Roles are unique within a single workshop set.
- Workshop-scoped recommendations carry the workshop id and type;
  program-level recommendations drop both fields and rewrite the
  id to the `sme-program:` namespace.
- Recommendation rosters differ across workshops within a single
  program (≥2 distinct rosters).
- Every workshop set carries ≥1 evidence-anchored reason and ≥1
  failure-mode-anchored reason.
- No string field invents a real person-name token (only the
  whitelisted role labels, agent names, and AbarVa-prefixed
  proper nouns are allowed).
- No string field invents a dollar amount or claims a real
  `E-###` evidence citation.
- `byRole`, `byParticipationMode`, and `byReadiness` summary counts
  reconcile to `totalCount`.
- Every recommendation carries
  `createdFrom: 'deterministic_sme_recommendation_seed'`.

## What is NOT yet wired

- **No live SME directory.** Recommendations are role-anchored only;
  there is no real person, no contact info, no calendar lookup.
- **No live availability / calendar / booking.** SmeReadiness is
  derived deterministically (`confirmed` for the Client Maestro,
  `confirmed` for required AbarVa Maestro slots, `tentative` for
  advisory AbarVa Maestro slots, `awaiting_outreach` for required
  client SMEs, `tentative` for optional roles).
- **No tenant-specific SME library.** Until a per-tenant SME
  library lands, the panel composes from the canonical role
  registry and the deterministic workshop readiness shape.
- **No persistence.** The panel reads only the deterministic
  read model on every render.

## What is deferred

- **Live SME directory + tenant-specific SME library.** Renders
  the recommended role with a real named SME and contact when the
  directory lands.
- **Live availability and booking.** Replaces deterministic
  readiness with real calendar state.
- **MW7 deliverable refinement loop.** Wires the SME
  recommendation into the deliverable refinement workflow.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/sme-recommendation-panel.test.ts` — pass
- `npx jest src/__tests__/integration/programs/workshop-readiness.test.ts` — pass (regression)
- `npm run build` — pass

## Status

Code complete. Pending founder review.
