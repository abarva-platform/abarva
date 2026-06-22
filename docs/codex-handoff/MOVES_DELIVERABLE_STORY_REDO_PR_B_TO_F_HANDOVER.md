# Codex Handover — Moves Story-Led Redo PR-B..F (build · test · validate · deploy)

Complete, self-contained handover to finish the **Moves deliverable story-led/exhibit-led redo**. PR-A
(the enforcement foundation) is merged-pending on **PR #3840**; this brief builds PR-B..F on top so
architecture/solution artifacts actually **render real visuals and pass the gate**, then re-proves
SkyHarbor IROPS end-to-end. **Read the standard first:**
`docs/build/MOVES_DELIVERABLE_STORY_REDO_STANDARD.md` (the 16-section authoritative standard).

Shared system, **every tenant** — no per-client code, no SkyHarbor-specific prompts/scripts, no
bandages. Depth is allowed; **never reject for length.**

---

## 0. What PR-A already gives you (do not rebuild)

- `src/lib/deliverables/planning/deliverable-plan.ts` — the reason-first `DeliverablePlan` +
  `validateDeliverablePlan` (architecture requires the current→gap→target chain).
- `src/lib/deliverables/profiles/types.ts` — §13 profile fields (`storyArc`, `currentStateRequired`,
  `conceptual/logical/physicalArchitectureRequired`, `visualRendererRequired`, `soWhatRequired`, …) +
  5 new quality dimensions.
- `src/lib/deliverables/profiles/registry.ts` — `target_state_architecture` adopts the standard.
- `src/lib/deliverables/quality/deliverable-quality-contract.ts` — story/current-state/gap-to-target/
  architecture-completeness/visual-exhibit checks + new states `blocked_storyline`,
  `blocked_missing_current_state`, `blocked_missing_architecture_level`, `blocked_missing_visuals`.
  **The `ContractInput` carries the signals** the renderer must set: `hasStorySpine`,
  `currentStateVisualPresent`, `gapToTargetBridgePresent`, `conceptualArchPresent`,
  `logicalArchPresent`, `physicalArchPresent`, `exhibitsRenderedAsVisual`.
- From #3801: `src/lib/visual-system/architecture-model.ts` (current/target states + agentic overlay),
  `architecture-html-renderer.ts` (renders some exhibits), `architecture-generation.ts` (governed
  `generateArchitectureModel` via injected `GovernedToolCall`), `architecture-egress-adapter.ts`
  (`governedArchitectureToolCall`), wired in `orchestrator/{generate-service,persistence}.ts`.
- **Reuse the expert-kernel SVG engine** — `src/lib/programs/expert-kernel/exports/board-grade/`:
  `svg-architecture.ts` (contextDiagram, layeredFlow, integrationMap, boundaryLaneMap,
  accountabilityMap, controlOverlay, archRiskHeatmap, openDecisionQueue, optionScorecard),
  `svg-charts.ts`, `pptx-renderer.ts`, `deck-shell.ts`. Do not write SVG from scratch where these fit.

---

## 1. PR-B — ArchitectureModel v2 (the reasoning structure)

Extend `src/lib/visual-system/architecture-model.ts` so the model carries the full
current→gaps→target reasoning and the three levels. Add:
- `currentStateFlow` — actors/teams, triggering event, systems, data sources, handoffs, decisions,
  manual work, delays, bottlenecks, missing telemetry, control gaps, value-leakage points (an
  ordered flow, not just nodes).
- `gapsMap: ObservedGap[]` (reuse the `ObservedGap` shape from `planning/deliverable-plan.ts`:
  observation → gap → designImplication → target capability).
- `gapToTargetBridge` — the explicit chain current observation → gap → design implication →
  target capability → architecture response.
- **Three architecture levels**: `conceptual` (business capabilities + human/AI/context/integration/
  governance/value layers), `logical` (components, data flows, services, decision points,
  interactions), `physical` (cloud/env, tenant boundary, runtime, data stores, integration endpoints,
  identity, logging, model boundary, security, deployment waves).
- Keep `agentic` overlay, `controlPoints`, `waves`, `openInputs`, `provenanceNote`.

Extend `validateArchitectureModel` to **error** when any of: current-state flow empty, gaps map empty,
gap-to-target chain broken, or any of conceptual/logical/physical missing. Tenant-agnostic.

**Test:** unit tests for the validator (missing level → error; broken gap chain → error; valid v2
model → no errors). Update the First Capital fixture to a v2 model.

---

## 2. PR-C — Render all 13 exhibits as real inline-SVG/HTML (the visible payoff)

Extend `architecture-html-renderer.ts` to render, as **actual SVG/HTML diagrams** (not prose/tables),
each with **title · visual · so-what · decision implication**:
1. current-state operating flow · 2. current-state system/data flow · 3. current-state gaps map ·
4. target conceptual architecture · 5. target logical architecture · 6. target physical/deployment ·
7. end-to-end data flow · 8. AI recommendation & decision-control flow · 9. human approval/override
model · 10. integration map · 11. governance/audit/telemetry flow · 12. implementation waves ·
13. architecture decision log.

Reuse expert-kernel `svg-architecture.ts` functions where they fit (layeredFlow → conceptual/logical;
integrationMap → integration; controlOverlay → governance; contextDiagram → current-state). HTML brief
layout per standard §10: executive hero · story-spine summary · current-state visual · gaps map ·
conceptual/logical/physical · data flow · AI/human control flow · governance/telemetry loop · waves ·
decision log · evidence drawer. Premium consulting look; no raw code, no placeholder spam; diagrams
understandable without the narrative.

**Critical wiring:** the renderer (or the contract-input builder in
`quality/deliverable-key-map.ts`) must **set the ContractInput signals truthfully** from what actually
rendered — `currentStateVisualPresent`, `conceptual/logical/physicalArchPresent`,
`gapToTargetBridgePresent`, `exhibitsRenderedAsVisual`, `hasStorySpine` — so a real visual artifact
passes the gate and a prose-only one fails. Do NOT hardcode them true; derive from the model/render.

**Test:** assert the rendered HTML contains actual `<svg`/diagram elements for each required exhibit;
assert each exhibit block contains a so-what line; assert a model missing a level produces no
`physicalArchPresent` signal → gate `blocked_missing_architecture_level`.

---

## 3. PR-D — Generation passes / prompts (reason first, then visual model)

In `orchestrator/generate-service.ts` (the live path), for artifacts whose profile sets
`visualRendererRequired`/`renderer:'html_architecture'`:
1. **Reasoning-plan pass** — a governed tool-use call (reuse the `governedArchitectureToolCall`
   pattern; new tool schema for `DeliverablePlan`) that emits the plan from the tenant's governed
   context; `validateDeliverablePlan(plan, {requireGapChain:true})` — regenerate/repair if invalid.
2. **Visual-model pass** — governed tool-use emitting the **ArchitectureModel v2** (extend
   `architecture-generation.ts`'s tool schema to the v2 shape incl. the 3 levels + gaps + current
   flow), grounded in the plan + governed context; `validateArchitectureModel` must pass.
3. Pass the model to `persistDeliverable` (`structuredModels.architectureModel`, `renderViaProfile`)
   → renderer draws it → contract evaluates with the real signals.
All governed (injected adapter, egress-audited), tenant-agnostic, fallback-safe. Apply the
**generation-honesty discipline** (no unsupported number as fact; cite / assumption / Open-Inputs /
mode-downgrade) so number-heavy artifacts come back honest — see
`docs/codex-handoff/SKYHARBOR_IROPS_DELIVERABLE_REPAIR_BRIEF.md`.

**Test:** with an injected fake plan+model generator, assert generate-service produces a plan, a
validated model, and hands it to persist; flag-off → byte-identical to today.

---

## 4. PR-E — PPT visual-first executive readout

Reuse expert-kernel `pptx-renderer.ts` + `deck-shell.ts`. Slides per standard §11 (storyline ·
current-state pain map · current-state flow · gap→design bridge · target conceptual · logical/data
flow · human+AI decision model · roadmap · value model · decision-required). **Insight headlines**, not
topic labels; slide exhibits from the model, not bullet walls.

**Test:** assert each slide headline is an insight sentence (not a bare noun label); assert exhibit
slides carry a visual exhibit reference.

---

## 5. PR-F — Re-run SkyHarbor IROPS end-to-end (the proof)

Use the shared profiles only. Drive the move organically (or the existing move
`450e0f12-7703-436b-97fc-f2f1712c094b`) through P3 Design and generate the Target Architecture +
Solution Design. Verify against standard **§16 acceptance**: current state visually drawn · gaps mapped
· target drawn · conceptual+logical+physical present · data flow · human/AI decision flow ·
governance/telemetry · solution-design scenario walkthrough · rendered in HTML with real SVG · readout
visual slides · every exhibit has so-what · coherent story · `client_ready` (not blocked) ·
`generated_artifacts.quarantined=false`. Export the HTML + a screenshot as evidence.

---

## 6. TEST (every PR)

```bash
# worktree off origin/main; link node_modules so tsc/jest resolve
git worktree add -b feat/<pr> /tmp/<wt> origin/main && cd /tmp/<wt>
ln -s <repo>/node_modules node_modules
npx tsc --noEmit -p tsconfig.json            # must be clean (ignore 6 optional-dep module errors)
npx jest src/lib/deliverables src/lib/visual-system   # must be green, no regressions
```
Add the **§15 tests** from the standard (fail the build if): no SVG/visual in target_architecture · no
current-state visual · no gap-to-target bridge · missing conceptual/logical/physical · required exhibit
prose-only · exhibit without so-what · solution design without scenario walkthrough · gate passes
without a story spine · client-facing artifact generated without a plan · long artifact rejected for
length · prose-only architecture persisted client-ready · HTML renderer outputs raw code/empty blocks ·
PPT slide with topic label not insight headline.

## 7. VALIDATE (before merge)

```bash
node scripts/release-check.mjs --base origin/main --head HEAD   # add a release record per PR
npm run audit:control-plane-purity:check                        # tenant-purity gate
```
- **Tenant-purity trap:** no hardcoded tenant strings ("First Capital", "SkyHarbor", …) in non-fixture
  control-plane code (`src/lib`,`src/app`,`src/components`). Put tenant content in `__fixtures__/`
  (now allowlisted) and reword comments tenant-neutral. Baseline must not increase.
- Each PR needs a release record under `docs/releases/records/` (template enforced by release-check).
- Out of scope / leave noted: `src/lib/programs/__tests__/governance-evaluate-gates.test.ts` mock
  missing `.in(...)` (pre-existing, unrelated).

## 8. DEPLOY

```bash
gh pr create … ; # squash-merge when CI green (control-plane tenant purity must pass)
# main merge auto-triggers aca-main-deploy.yml → builds image, deploys ca-abarva-web-lab-eastus,
#   updates worker jobs, shifts traffic, verifies health. Rerun the run on ACR ConnectionReset.
```
- **Flags are already LIVE for SkyHarbor** (set on `job-abarva-deliv-worker`,
  `job-abarva-deliv-worker-event`, `ca-abarva-web-lab-eastus`):
  `ABARVA_FEATURE_DELIVERABLE_STRUCTURED_EXHIBITS_TENANTS=skyharbor,skyharbor-air` and
  `ABARVA_FEATURE_DELIVERABLE_QUALITY_CONTRACT_TENANTS=skyharbor,skyharbor-air`. No flag change needed
  for the SkyHarbor proof; deploy is otherwise **dark** for other tenants until their flags flip.
- After deploy, confirm `az containerapp ingress traffic show -g rg-abarva-controlplane-lab-eastus -n
  ca-abarva-web-lab-eastus` puts 100% on the new revision, and the worker jobs reference the new image.

## 9. CONSTRAINTS / ACCEPTANCE

- Shared Moves profiles only — no per-client code, no per-tenant prompts, no one-off scripts.
- Never reject for length; never pass a storyless or prose-only architecture; every exhibit has a
  so-what; the model reasons before it renders.
- Report honestly per artifact (per the context-ingestion truth standard): plan validated → model
  validated → exhibits rendered (which) → gate state → quarantined?. The final SkyHarbor output must
  feel like a senior consulting team explaining how the client moves from fragmented IROPS recovery to
  a governed AI-assisted decision system — visually, end to end.

## 10. Deliver back

Per PR: branch/PR#, files, tests added, tsc/jest/release-check status. For PR-F: the move id, the
exported Target Architecture HTML (with real SVG exhibits) + screenshot, the per-artifact gate states
(all `client_ready`, `quarantined=false`), and an honest note on anything still blocked.
