# ACT12 · AI Tool Waste / License Utilization Signals

Slice ID: ACT12
Slice name: AI Tool Waste / License Utilization Signals
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)
Type: Application code (deterministic read model + integration
tests). No application UI, no runtime modification, no migrations,
no model calls, no live integrations.

Operationalizes the **AI tool-waste / license-utilization** view of
the AI Control Tower contract
([ACT1](./ACT1_AI_CONTROL_TOWER_CONTRACT.md)) by projecting a
deterministic, cross-tenant inventory of license-waste and
shadow-IT signals into a typed read model. The Tower will compose
this read model into Atlas brief content, Sentinel pattern surfaces,
and Steward governance gates in later slices. This slice is
**types + seed + helpers + tests only**; no surface binds it yet.

---

## A. What this slice ships

### Module

[`src/lib/tower/ai-tool-waste-signals.ts`](../../../src/lib/tower/ai-tool-waste-signals.ts)

Public types and tuples:

- `AI_TOOL_WASTE_SIGNAL_KINDS` and `AiToolWasteSignalKind`
  (`unused_license | duplicate_license | shadow_it | underused_seat
  | expired_subscription | overprovisioned`).
- `AI_TOOL_WASTE_SEVERITIES` and `AiToolWasteSeverity`
  (`low | medium | high | critical`).
- `AI_TOOL_WASTE_STATUSES` and `AiToolWasteStatus`
  (`detected | in_review | remediated | accepted | escalated`).
- `AiToolWasteSignal` and `AiToolWasteSignalSummary`.

Public helpers:

- `buildAiToolWasteSignalsSeed()` — returns the canonical 22-row
  seed.
- `summarizeAiToolWasteSignals(signals?)` — reconciles totals,
  exposes `byKind` / `bySeverity` / `byStatus` records keyed by every
  canonical enum value (zero allowed); defaults to the canonical
  seed.
- `getCriticalWasteSignals(signals?)` — filters to
  `severity === 'critical'`.

### Tests

[`src/__tests__/integration/tower/ai-tool-waste-signals.test.ts`](../../../src/__tests__/integration/tower/ai-tool-waste-signals.test.ts)

63 deterministic integration tests covering shape & determinism,
kind / status / severity coverage, per-row invariants, distribution
constraints (≥ 3 critical, ≥ 3 shadow_it, ≥ 2 program-linked, ≥ 2
use-case-linked), summary reconciliation, helper behavior,
no-fabrication invariants (no dollar amounts, no real product names,
no banned placeholder language), and module hygiene (no banned
runtime imports, no `Date.now` / `Math.random` / `fetch(` /
`anthropic` / `openai` / `useState` / `useEffect`).

### Manifest updates

- [`docs/build/build-slices.json`](../build-slices.json) gains an
  `ACT12` entry (status `code_complete`, risk `low`,
  `dependsOn: ["ACT6"]`).
- [`docs/build/production-readiness.json`](../production-readiness.json)
  gains a note on the `ai_control_tower` component acknowledging
  ACT12. The component is **not promoted**; status is preserved.

---

## B. No-fabrication contract

Honors the ACT1 §K no-fabrication rules: no fake dollars, no real
product names (deny-list scan covers Copilot / ChatGPT / Claude /
Gemini / OpenAI / Anthropic / Cohere / Mistral / Databricks /
Snowflake / Microsoft / GitHub / Notion / Glean / Perplexity / Bard
/ Llama), no banned placeholder language. Every signal carries
`createdFrom: 'deterministic_ai_tool_waste_signals_seed'`. Tool
labels use the canonical `ai-tool-placeholder-{n}` form so the
Tower can show waste posture without endorsing or accusing any
vendor brand.

---

## C. What this slice does NOT do

- **No tenant scoping.** Cross-tenant shape only. Per-tenant binding
  lands in a follow-up ACT12.x slice once Steward captures license
  inventories per tenant.
- **No connector binding.** Seed is the only data source. ACT12.x
  will replace the seed with an IDP / procurement / SaaS-management
  connector projection.
- **No Atlas brief composition.** Brief composition happens in ACT9.
- **No Tower UI.** Surface binding happens in ACT10.
- **No persistence, no migrations, no model calls, no network.**

---

## D. Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/tower/ai-tool-waste-signals.test.ts`
  — 63 / 63 pass.

---

## E. Status

Code complete. Pending founder review for promotion to `verified`.
Conservative — does not promote any production-readiness component.
