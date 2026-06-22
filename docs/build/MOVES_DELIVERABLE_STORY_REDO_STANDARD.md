# Moves Deliverable Generation — Story-Led / Exhibit-Led Standard (v2 redo)

**Status:** authoritative standard · **Date:** 2026-06-21 · branch `feat/moves-deliverable-story-redo`
**Supersedes** the prose-section-pack generation. Shared system, **every tenant** — no per-client code.

## 0. The failure this fixes

The SkyHarbor IROPS run produced artifacts that were **mechanical, prose-heavy, and lacked a visual
storyline**. The fix is **not** word/section limits (depth is allowed — never cap length). The fix is
that every client-facing Moves artifact must be **story-led, context-grounded, and exhibit-led**, and
architecture/solution artifacts must **visually explain how the solution comes together** by reasoning
**current state → gaps → target state** and rendering that reasoning as real diagrams (SVG / HTML / PPT
exhibits) plus supporting narrative. Generate **authored consulting artifacts, not section packs.**

The reader must be able to understand: (1) the current operating environment, (2) why it creates
friction/risk/cost/delay/value-leakage, (3) the gaps, (4) what target state changes, (5) how the
solution works end-to-end, (6) how the architecture fits conceptually/logically/physically, (7) how
people·systems·data·AI·controls·telemetry·value interact, (8) the decisions required.

## 1. Reason first — the generation flow (mandatory for every artifact)

> tenant context → move/use-case context → artifact profile → **current-state interpretation** →
> **gap analysis** → **target-state hypothesis** → **storyline / story spine** → **exhibit plan** →
> **visual artifact generation** → narrative artifact generation → quality gate → renderer → persist.

Do NOT generate the document directly from input files. **The model reasons first**, emitting a hidden
**DeliverablePlan** before any artifact is produced — see `src/lib/deliverables/planning/`. The plan
holds: artifactType · audience · decisionPurpose · one-sentence storyline · current-state
interpretation · major gaps · target-state hypothesis · required decisions · required exhibits +
exhibit purpose · narrative sequence (story beats) · evidence needed · missing inputs · assumptions ·
risks · expected reader takeaway. **No artifact generates without a validated plan.**

## 2. No hard limits — quality is story + visuals, not length

No hard word/page/table/section caps as the control. **Reject** artifacts that are mechanical,
generic, repetitive, disconnected, visually weak, unsupported, storyless, machinery-exposing, or
missing "so-what." **Never reject for length.** Every section must earn its place by advancing the
story, explaining a decision, interpreting evidence, showing the architecture, clarifying the
operating model, explaining value, or reducing execution risk.

## 3. Story spine — every artifact

Every artifact has a visible story spine answering: what the client is trying to accomplish · what's
broken/slow/risky/expensive/unclear/under-governed today · why it matters now · what the evidence
suggests · the recommended direction · how the solution works · how the architecture enables it · how
humans+AI work together · how value is measured · what must be validated · the decision required. The
story must be **visible in the document**, not implied. (Reference good/bad output: §3 of the source
directive — judgment-led, client-specific narration over component lists.)

## 4–8. Architecture & solution must be VISUAL and reasoned

- **Architecture is never prose-only.** Real visuals: inline SVG, HTML/CSS flow diagrams, swimlanes,
  layered maps, cards+connectors, current↔target comparisons, visual roadmap waves. Plain tables do
  not satisfy the visual requirement. If exhibits don't render → **fail the gate, do not persist.**
- **Current state is DRAWN, not described** — actors/teams, triggering event, systems, data sources,
  handoffs, decisions, manual work, delays, bottlenecks, missing telemetry, control gaps, value
  leakage. Make the pain visible (for IROPS: a disruption event moving through OCC · crew · dispatch ·
  stations · TechOps · CX · finance · leadership · data/analytics · governance).
- **Reason current → gaps → design implications → target capabilities → target architecture.** Show
  the chain; never jump straight to target architecture.
- **Three architecture levels, all required:** **Conceptual** (business capabilities + human/AI/context/
  integration/governance/value layers — "how the concept works"), **Logical** (components, data flows,
  services, decision points, interactions — "how components interact"), **Physical/Deployment** (cloud/
  env, tenant boundary, runtime, data stores, integration endpoints, identity, logging, model boundary,
  security, deployment waves — "how it's built/deployed/secured/operated"). Missing any level → not
  client-ready.
- **Solution design shows a real-life scenario flow** (event → signals → enrich → constraints → AI
  options → human review → tradeoffs → approve/override → downstream action → updates → telemetry →
  value), shown **visually**, plus user/system/data/AI/approval/exception/value journeys.

Architecture artifacts must include (min): current-state operating flow · current-state system/data
flow · current-state gaps map · target conceptual · target logical · target physical · end-to-end data
flow · AI recommendation & decision-control flow · human approval/override model · integration map ·
governance/audit/telemetry flow · implementation waves · architecture decision log.

## 9. Exhibits carry the story

Every exhibit has: title · purpose · visual · **so-what interpretation** · decision implication. No
decorative visuals. **The gate fails any exhibit lacking interpretation.**

## 10–11. HTML & PPT standards

- **HTML architecture = first-class artifact** (not an export fallback): executive hero · story-spine
  summary · current-state visual · gaps map · conceptual/logical/physical architecture · data flow ·
  AI/human control flow · governance/audit/telemetry loop · implementation waves · decision log ·
  evidence drawer. Premium consulting look; inline SVG for layered maps/component diagrams/swimlanes/
  flows/decision loops; diagrams understandable without reading the full narrative; no raw code, no
  placeholder spam. **No diagram elements → fail.**
- **PPT executive readout = visual-first**: storyline · current-state pain map · current-state flow ·
  gap→design bridge · target conceptual · logical/data flow · human+AI decision model · roadmap ·
  value model · decision-required. Every slide headline states the **insight**, not a topic label.

## 12. Quality gate — story + visuals (`assessClientDeliverable`)

New dimensions: **storyline quality** · **current-state reasoning** · **gap-to-target reasoning** ·
**architecture completeness (conceptual+logical+physical)** · **visual exhibit quality (render +
so-what)** · human-consultant voice · evidence discipline. New failure states:
`blocked_missing_visuals` · `blocked_missing_current_state` · `blocked_missing_architecture_level` ·
`blocked_storyline` (+ existing `blocked_quality` · `blocked_missing_inputs` · `blocked_governance`).
**Long may pass; storyless or visual-less must fail; prose-only architecture must fail.**

## 13. Profile fields (every Moves artifact)

`narrativeQuestion` · `storyArc` · `currentStateRequired` · `gapAnalysisRequired` ·
`targetStateRequired` · `requiredStoryBeats` · `requiredExhibits` · `exhibitNarrativeRole` ·
`visualRendererRequired` · `conceptualArchitectureRequired` · `logicalArchitectureRequired` ·
`physicalArchitectureRequired` · `soWhatRequired` · `decisionMoment` · `readerTakeaway` ·
`antiPatterns`. (See `moves.target_architecture` profile for the canonical example.)

## 14. Shared, not SkyHarbor-specific

The IROPS context (decision-system, not just automation; OCC/crew/dispatch/stations/TechOps/CX/finance
fragmentation → governed AI-assisted recovery decision system) is what the model must **reason
through** — but via the **shared Moves profiles + generation system**, never SkyHarbor-specific code or
prompts. The same approach works for every tenant and future client.

## Build sequence (this redo)

1. **PR-A (this branch, foundation):** DeliverablePlan contract + profile fields + quality-gate
   story/visual/architecture dimensions & new failure states + tests. (Makes the standard enforceable —
   prose-only/storyless artifacts fail.)
2. **PR-B:** ArchitectureModel v2 — current-state-flow + gaps map + gap-to-target bridge +
   conceptual/logical/physical levels + governance/telemetry; the 13 required exhibits in the model.
3. **PR-C:** HTML renderer — render all 13 exhibits as real inline-SVG/HTML diagrams, each with
   so-what; the first-class HTML architecture brief layout.
4. **PR-D:** Generation passes/prompts — the reasoning-plan pass + the visual-model population pass
   (governed adapter), so generation emits the plan then the structured visual model, then narrative.
5. **PR-E:** PPT visual-first readout (insight headlines, slide exhibits) via the existing pptx-renderer.
6. **PR-F:** Re-run SkyHarbor IROPS end-to-end against the §16 acceptance criteria (shared profiles only).

## 16. Acceptance (the rerun bar)

Current state visually drawn · gaps visually mapped · target visually drawn · conceptual+logical+
physical present · data flow · human/AI decision flow · governance/audit/telemetry flow · solution
design scenario walkthrough · architecture rendered in HTML with real SVG/flow diagrams · executive
readout visual slides · every exhibit has so-what · coherent story · gate fails prose-only architecture
· nothing rejected for length · nothing passes merely for many sections · generated via **shared Moves
profiles, not tenant-specific code.** The output should feel like a senior consulting team explaining
how the client moves from a fragmented current state to a governed AI-assisted decision system.
