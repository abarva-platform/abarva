# S9g · Tower · Atlas Executive Brief for Program Pressure

Slice ID: S9g
Slice name: Tower · Atlas Executive Brief for Program Pressure
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

Adds a deterministic Atlas Executive Brief to the canonical tenant
Control Tower above the Programs pressure cards. The brief is composed
from the S9e signal read model and the S9f Tower view; **no live Atlas
runtime, no Claude / OpenAI invocation, no migrations, no model calls.**

## What changed

- New helpers in
  [src/lib/tower/program-pressure-view.ts](../../../src/lib/tower/program-pressure-view.ts):
  - `AtlasProgramPressureBrief` type with fields `title`,
    `topPressure`, `whyItMatters`, `programsAffected`,
    `evidenceValueWarning`, `recommendedExecutiveAction`,
    `suggestedFollowUps`, `confidenceLabel`, `interpretationBasis`,
    `sourceLabel`.
  - `buildAtlasProgramPressureBrief(tenant, signals, summary)` →
    composes the brief from a tenant + S9e signal list + S9e summary.
    Pure: same inputs always yield identical output.
  - `buildAtlasPressureNarrative(signals, summary)` → single-sentence
    narrative naming the top severity (uppercase) and the top program
    code.
  - `buildAtlasExecutiveAction(signals, summary)` → executive next
    step. When the top signal is critical, returns its
    `recommendedAction` directly; otherwise falls back to a "review
    the top N cards" sentence.
  - `AtlasBriefConfidenceLabel`: `high` | `medium` | `low` |
    `no_signals`. Today the cap is `medium` because all signals are
    seed-only.
  - `AtlasBriefSourceLabel`: `deterministic_seed` |
    `program_pressure_signals`.

- Component update at
  [src/components/tower/ProgramPressureCards.tsx](../../../src/components/tower/ProgramPressureCards.tsx):
  - New `<AtlasExecutiveBriefPanel>` rendered above the executive
    metric strip, beneath the section header.
  - Eyebrow: "Atlas executive brief · program pressure signals".
  - Confidence chip on the right with tooltip = `interpretationBasis`.
  - Five labeled brief lines: Top pressure · Why it matters ·
    Programs affected · Evidence + value (only when present) ·
    Recommended action.
  - "Ask Atlas · suggested follow-ups · 3" footer rendering three
    `<button disabled aria-disabled="true">` chips with each
    follow-up's reason in the tooltip. Visible-but-disabled state
    advertises the future Atlas runtime affordance honestly.
  - Footer caption echoes `interpretationBasis`.

- Tests appended to
  [src/__tests__/integration/tower/program-pressure-cards.test.ts](../../../src/__tests__/integration/tower/program-pressure-cards.test.ts).

## How the brief is derived from S9e / S9f

1. `<ProgramPressureCards>` resolves a `TowerProgramPressureView` from
   `buildTowerProgramPressureView(tenant)` (S9f), which itself wraps
   `buildTenantProgramControlTowerSignals(tenant)` and
   `summarizeProgramControlTowerSignals(...)` (S9e).
2. The component then calls
   `buildAtlasProgramPressureBrief(tenant, view.signals, view.summary)`.
3. The brief functions read **only** the tenant identity and the
   pre-computed signals/summary; they never touch program seed data
   directly.

This preserves the S9e read-model boundary: any future tightening of
the signal classifier (severity heuristics, type rank) automatically
flows into the brief without further changes.

## What is deterministic today

- Brief is byte-equal across repeated calls for the same tenant.
- Follow-up ids are fixed and ordered:
  `atlas-followup-walk-top-pressure`,
  `atlas-followup-evidence-value-gaps`,
  `atlas-followup-portfolio-summary`.
- Confidence label is capped at `medium` while all signals are
  seed-only — the brief cannot claim `high` from seed alone (test
  enforced).
- The brief never invents a dollar amount in any string field (test
  enforced).
- `evidenceValueWarning` is the empty string when no
  `evidence_not_ready` / `value_not_ready` signals exist; a
  non-empty warning sentence otherwise (test enforced).

## What is NOT yet live Atlas runtime

- No Claude / OpenAI / Pinecone invocation.
- No streaming compose.
- No persisted Atlas turn or feedback signal log.
- No subscription to live signal-summary deltas.
- The "Ask Atlas" follow-up chips are visible but disabled — clicking
  them does nothing today; they exist to advertise the future
  affordance.
- Confidence cannot reach `high` from the seed alone; live retrieval
  + scoring is needed.

## What is deferred to future slices

- **Atlas runtime subscriber slice** — wire a live Atlas listener that
  composes the brief through `runPipeline()` (Nexus orchestrator),
  promotes confidence to `high` when retrieval is strong, and
  enables the follow-up chips.
- **Persistence + dedup slice** — append-only Atlas turn log keyed by
  brief id, replayable across reruns.
- **Notification / steering-touchpoint export** — render the brief
  into a steering-committee summary export.
- **Live evidence + value signals** — once a future seed-population
  slice lands, `evidence_not_ready` / `value_not_ready` signals can
  promote and the brief's evidenceValueWarning can disappear without
  any change here.

## Honest fallbacks used

- Empty-tenant brief: distinct copy that names the absence ("No
  Programs pressure signals are present in the seed today.") rather
  than fabricating an executive headline. `confidenceLabel:
  'no_signals'`, `sourceLabel: 'deterministic_seed'`.
- The `interpretationBasis` field always names the limit of the
  current brief ("Multiple critical signals from seed-only readiness;
  live Atlas subscriber would refine this.").
- Follow-up chips render `enabled: false` and the component renders
  them with `disabled` + `aria-disabled="true"` plus a "deferred ·
  live atlas runtime" sub-label. Clicking does nothing.
- Confidence cap at `medium` for any seed-only mix is enforced by a
  test that asserts no brief claims `high` confidence.
- Brief never imports Atlas / Nexus / agent runtime / Source / mock.
  Component imports are restricted to the S9e/S9f helper module.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/tower/program-pressure-cards.test.ts` — 39 passed (20 prior S9f tests + 19 new S9g tests)
- Regression suites pass (S7, S9, S9b, S9c, S9d, S9e, S9f).
- `npm run build` — pass

Promotion to `verified` requires a live walk by founder confirming
the new Atlas brief panel renders correctly on `/tenant/[slug]/tower`
for at least two canonical demo tenants and that the disabled
follow-up chips are visible-but-non-interactive as intended.

## Status

Code complete. Pending founder review.
