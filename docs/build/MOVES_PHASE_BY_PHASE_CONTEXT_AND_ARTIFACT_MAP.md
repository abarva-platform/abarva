# Moves — Phase-by-Phase Context Binding & Artifact Map (the fix, grounded)

The thread through every phase is one **cumulative `SolutionContext`** per move: each phase **reads it in
full**, generates a rich artifact, and **digests its insights back** — so the solution *learns and
progresses*. Today this object doesn't exist; phases bind `[DATA GAP]` stubs + 1800-char clips.

## The map (input → process → gate → deliverables → where we change → how it gets rich)

### P0 · Originate
- **Input:** intake — problem, sponsor, the **use case**, tenant.
- **Process:** capture; seed the move.
- **Gate:** intake approved → P1.
- **Deliverables:** origination brief.
- **CHANGE:** create the `SolutionContext` here; write `useCase`, `sponsor`, `tenantProfile`.
- **Rich/flashy:** n/a (capture).

### P1 · Charter
- **Input:** `SolutionContext` (use case) + tenant profile.
- **Process:** generate Charter.
- **Gate:** charter signed off + sponsor committed + value range ratified.
- **Deliverables:** **charter**.
- **CHANGE:** charter generation must **emit structured KPIs + priority** and write them back to
  `SolutionContext` (`kpis`, `priority`). Today the charter is a 1800-char clip downstream — keep the
  *full* structured charter in `SolutionContext`.
- **Rich/flashy:** decision-led DOCX/HTML; KPI panel exhibit.

### P2 · Discover & Diagnose
- **Input:** `SolutionContext` (use case, KPIs) **+ the client's REAL current-state estate retrieved
  from the tenant context layer** (the Epic/SQL/Tableau-equivalent) — *not* `[DATA GAP]`.
- **Process:** generate current-state + gap analysis **aligned to the use case**.
- **Gate:** diagnosis reviewed → P3.
- **Deliverables:** **discovery_report**, **root_cause_worksheet**.
- **CHANGE (keystone #1):** kill the stubs in `v2-generator.ts:336-341`
  (`'${client.tech_stack}': '[DATA GAP…]'`) → **retrieve real current-state** from the
  AgentContextBroker / `enterprise_context`. Write `currentState`, `gaps` back to `SolutionContext`.
- **Rich/flashy:** current-state **drawn** (actors/systems/flows/bottlenecks); gap map exhibit.

### P3 · Design  *(the phase with the biggest gap)*
- **P3a · Approach + Options** — **MISSING TODAY, must be added.**
  - **Input:** use case + KPIs + current state + gaps (all from `SolutionContext`).
  - **Process:** **a Claude call** → approach narration + **solution options** + recommendation →
    **human review / approve / edit → edits digested back** into `SolutionContext` (`chosenOption`).
  - **Gate:** approach + chosen option approved by sponsor.
  - **Deliverables:** **NEW** `approach_and_options` artifact.
  - **CHANGE (keystone #3):** add the template + the generation + the review/digest loop. No such
    artifact or step exists today (grep returns nothing).
- **P3b · Solution + Architecture** — exists, but jumps here without P3a.
  - **Input:** `SolutionContext` **including the chosen option**.
  - **Process:** generate solution design + target architecture **driven by the chosen option** + a
    native/non-native **pattern**.
  - **Gate:** architecture decisions approved.
  - **Deliverables:** **solution_design**, **target_state_architecture**, **operating_model_design**,
    **sourcing_strategy**.
  - **CHANGE:** bind the *full* `SolutionContext` (chosen option) — today `design_brief` binds
    `[DATA GAP]` for tech stack/data/security and asks for **markdown**. Switch to **Claude-authored
    flashy HTML** (system prompt + `output_format:'html'`). Write `architecture`, `pattern` back.
- **Rich/flashy:** the decision matrix (options→pick), the layered architecture, the native/non-native
  pattern diagram with the member-spine + medallion — all real because the chosen option + current
  state are bound.

### P4 · Roadmap / Plan
- **Input:** full `SolutionContext`.
- **Process:** generate roadmap + business case.
- **Gate:** funding/roadmap approved.
- **Deliverables:** **execution_roadmap**, **business_case**, **financial_model**, **tower_metrics_plan**.
- **CHANGE:** roadmap must be **mapped to the KPIs** (from `SolutionContext`), 3/6/9/12 with a KPI per
  increment; business case auto-downgrades when finance-grade inputs absent (mode-downgrade). Write
  `roadmap`, `businessCase`.
- **Rich/flashy:** 3/6/9/12 roadmap exhibit + KPI-trajectory chart.

### P5 · Mobilize / Handoff
- **Input:** the **whole** `SolutionContext`.
- **Process:** generate the executive handoff — the complete story.
- **Gate:** final decision / approve next phase.
- **Deliverables:** **handoff_package**, **value_measurement_contract**.
- **CHANGE:** the handoff is the *story spine assembled from `SolutionContext`* — not a re-derivation.
- **Rich/flashy:** PPT-first storyline, decision by slide 2, exhibits carried from prior phases.

## The 4 cross-cutting changes (this is "where we make changes")

1. **`SolutionContext` object + per-phase digest seam** — new; threads all phases; replaces
   `loadDeliverableSummaries` 1800-char clips with structured, full, cumulative context.
2. **Real current-state retrieval** — `v2-generator.ts:336-341` stubs → AgentContextBroker /
   `enterprise_context` retrieval. (Kills `[DATA GAP]`.)
3. **The P3a Approach + Options step + human review/approve/digest** — new template, new generation,
   new gate, write `chosenOption` back. (The missing driver of the architecture.)
4. **Claude-authored flashy HTML generation** — per-artifact: a **system prompt** (senior
   architect/designer), `output_format:'html'`, the design directive (custom inline SVG, the story
   beats + required exhibits from the profile), bound to the full `SolutionContext`. Replaces the
   markdown "fill-the-outline" template. Governed by the no-fabrication + the story/visual quality gate.

## How each artifact gets richness + detail + flashiness (the recipe)

Every artifact = **(real bound context from `SolutionContext` + retrieved current state)** × **(a
system prompt casting Claude as a senior consultant + designer)** × **(`output_format:'html'` with
custom SVG)** × **(the profile's `storyArc` + `requiredExhibits` + so-whats)** × **(the story/visual
quality gate that fails prose-only / storyless / DATA-GAP output)**. The two manual artifacts that
landed proved this exact recipe — they had the context and the directive; the product has neither yet.
