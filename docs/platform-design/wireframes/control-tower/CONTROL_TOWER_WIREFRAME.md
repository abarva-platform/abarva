# AI Control Tower - Atlas Executive Operating View

Source artifacts:

- Founder-authored DOCX: `docs/platform-design/wireframes/control-tower/CONTROL_TOWER_WIREFRAME.docx`
- Normalized from `/Users/anand/Downloads/AbarVa_Wireframe_Specifications_Program_Intelligence_Tower/AbarVa_Control_Tower_Wireframe_Specification.docx`

## 1. Page identity

- Canonical page name: `AI Control Tower - Atlas Executive Operating View`
- Route: `/tenant/[tenantSlug]/tower`
- Surface: `Control Tower`
- Primary agent owner: `Atlas`
- Secondary agents: `Nexus`, `Sentinel`, `Steward`
- Primary user question: Are AI investments creating enterprise value, scaling safely, and improving work, and what executive decision should we make next?

## 2. Five-question test answers

- Where am I: shell and page header identify `Apex Retail - AI Control Tower - Atlas`.
- What matters right now: Atlas executive brief summarizes the highest-priority value/risk/adoption signal.
- What is blocked or at risk: pressure cards and Steward blocker card expose the current blockers.
- What does the agent recommend: Atlas recommendation card and active lens action area provide the decision framing.
- What should I do next: action bar offers `Open decision brief`, `Assign evidence owner`, `Schedule review`, and `Custom`.

## 3. Zone composition

- Zone A: canonical AbarVa shell with Control Tower active.
- Zone B: context strip with tenant, portfolio lens, data tier, deterministic/live caveat, and freshness note.
- Zone C: Atlas-led executive workspace with one active lens at a time, five scorecards max, and three pressure cards max.
- Zone D: agent rail with Atlas primary and contextual Steward/Sentinel/Nexus cards.
- Zone E: drawers for executive decision, evidence basis, program impact, risk/readiness, and lens detail.

## 4. ASCII wireframe with coordinate labels

```text
+------------------------------------------------------------------------------------------------------+
| [A-1] AbarVaLogo [A-2] Apex Retail - Rich [A-3] Home Programs Source Intelligence Tower Admin [A-4]|
+------------------------------------------------------------------------------------------------------+
| [B-1] Context: Tower - Atlas - Lens: Portfolio - Data: deterministic - Source signal: AMS risk      |
+------------------------------------------------------------------------------------------------------+
| [C-1] Control Tower Header                                          | [D-1] Agent Rail            |
| [C-2] Atlas Executive Brief                                         | [D-2] Atlas Recommendation |
| [C-3] Lens Nav: Portfolio | Adoption | Value | Risk | Cost | Prod  | [D-3] Steward Blocker      |
| [C-4] Active Lens Canvas                                            | [D-4] Sentinel Caveat      |
| [C-5] Pressure Cards                                                | [D-5] Nexus Program Action |
| [C-6] Recommended Executive Action + Decision Options               | [D-6] 3 Suggestions+Custom |
| [C-7] Evidence / Source Basis Preview                               |                            |
| [C-8] Action Bar                                                    |                            |
+------------------------------------------------------------------------------------------------------+
| [E-1] Decision, evidence, program impact, risk/readiness, and lens-detail drawers                    |
+------------------------------------------------------------------------------------------------------+
```

## 5. Element catalog

- `A-1` Canonical shell and brand: must use the approved AbarVa shell and wordmark.
- `B-1` Tower context strip: makes deterministic/live posture explicit and keeps executive claims honest.
- `C-2` Atlas executive brief: concise synthesis, not a KPI wall.
- `C-3` Lens navigation: thin, focused, and limited to the core executive lenses.
- `C-4` Active lens canvas: at most five scorecards with whitespace and clear interpretation.
- `C-5` Pressure cards: at most three pressures, tied to real evidence or missing evidence.
- `C-6/C-8` Executive action and action bar: decision support only, not workflow automation.

## 6. Click and interaction map

- Lens chip -> updates active lens canvas.
- Scorecard -> opens lens detail drawer.
- Pressure card -> opens risk/readiness drawer.
- Open decision brief -> opens read-only executive decision drawer.
- Assign evidence owner / schedule review -> currently open deferred explanation drawers rather than mutate live state.
- Evidence chip -> opens evidence/source basis drawer.

## 7. Agent editorial contract

- Authoring agent: `Atlas`
- Required context bundle: tenant, portfolio signals, adoption/value/risk/productivity/cost data, evidence basis, missing metrics, source/program impacts.
- Permitted modes: `status`, `diagnostic`, `recommendation`, `executive`, `evidence`, `refusal_or_caveat`
- Voice contract: executive synthesis of value/risk tradeoffs with clear decision implications.
- Honest disclosure: missing metrics must show before any strong recommendation.
- Forbidden behavior: no invented financial outcomes, no fake live telemetry, no evidence-free investment recommendation.

## 8. Suggested actions specification

- Fresh load with full context:
  - Open executive decision brief
  - Show top risk pressure
  - Compare value and adoption signals
  - Custom
- Missing value data:
  - Show missing metrics
  - Open evidence basis
  - Ask Steward for readiness blockers
  - Custom
- High-risk portfolio:
  - Open risk lens
  - Create executive review action
  - Show affected programs
  - Custom

## 9. Workflow state rendering

- Tower state model: selected lens plus signal states such as `observed`, `evidence_partial`, `action_recommended`, and `deferred`
- Current lens is visually dominant.
- Resolved pressures are muted and move below active pressures.
- At-risk signals require evidence or governance explanation.
- No tower interaction changes enterprise status without approved workflow.

## 10. File attachment behavior

- Control Tower does not accept direct uploads.
- Evidence must be attached at the originating Programs, Source, or Admin/Data surfaces.
- Tower only consumes linked evidence and source/program basis.

## 11. Cross-surface consistency

- Scorecards and counts must match Programs, Source, Intelligence, and demo registry surfaces when they refer to the same objects.
- Source commercial signals must remain aligned with Source and Intelligence.
- Value/risk claims must honor the same caveats shown in Production Readiness and related admin surfaces.
- Atlas actions must map to real work objects or explicitly disclose missing data.

## 12. Failure modes this page must prevent

- KPI theater with no decision framing
- Fake live telemetry or green enterprise health claims from deterministic seed data
- Overloaded executive dashboard density
- Unactionable insights with no next step
- Generic executive summaries that could apply to any tenant

## 13. Acceptance criteria

- Five-question test passes above the fold.
- Atlas executive brief, active lens, top scorecards, pressure cards, evidence basis, and next action render within first scroll depth.
- No more than five scorecards and three pressure cards show at once.
- Design canon remains calm, premium, and restrained.

## 14. Persona walkthrough

- Persona: CIO, CTO, CFO delegate, or transformation executive.
- Goal: decide what executive action is needed next across the AI portfolio.
- First three seconds: the user sees the tenant context, the active lens, Atlas brief, and top pressures.
- Turn 1: inspect the top risk or value pressure.
- Turn 2: open the evidence/source basis to understand confidence.
- Turn 3: compare the related program or Source signal impact before scheduling or briefing.
- Exit state: the executive leaves with a concrete decision posture and no illusion of live, evidence-complete telemetry.

