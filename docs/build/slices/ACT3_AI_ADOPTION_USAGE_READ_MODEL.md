# ACT3 · AI Adoption & Usage Read Model

Slice ID: ACT3
Slice name: AI Adoption & Usage Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Application code (deterministic read model + integration
tests). No application UI, no runtime modification, no migrations,
no model calls, no live integrations.

Operationalizes dimension #2 of the AI Control Tower contract
([ACT1](./ACT1_AI_CONTROL_TOWER_CONTRACT.md)) by projecting a
deterministic, cross-tenant inventory of AI tool adoption and usage
records into a typed read model. This slice is **types + seed +
helpers + tests only**; no surface binds it yet. Tower brief
composition (ACT9) and the Tower UI (ACT10) layer onto this seed in
later slices.

ACT3 sits alongside [ACT2](./ACT2_AI_PORTFOLIO_INVENTORY_READ_MODEL.md):
ACT2 captures which use cases the enterprise is investing in; ACT3
captures how broadly the underlying tooling is actually being used.

---

## A. What this slice ships

### Module

[`src/lib/tower/ai-adoption-usage.ts`](../../../src/lib/tower/ai-adoption-usage.ts)

Public types:

- `AI_TOOL_KEYS` (canonical tuple) and `AiToolKey`.
- `AI_ADOPTION_HEALTH_STATES` and `AiAdoptionHealth`.
- `AI_USAGE_VOLUME_BANDS` and `AiUsageVolumeBand`.
- `AI_WORKFLOW_COVERAGE_STATUSES` and `AiWorkflowCoverageStatus`.
- `AI_ADOPTION_GOVERNANCE_FLAGS` and `AiAdoptionGovernanceFlag`.
- `AiToolAdoptionRecord`.
- `AiAdoptionUsageSummary`.

Public helpers:

- `buildAiAdoptionUsageInventory()` — returns the canonical seed.
- `summarizeAiAdoptionUsage(records?)` — reconciles totals; sorts
  unique sets ascending; defaults to the canonical seed.
- `getAiAdoptionByTool(tool, records?)` — filters by tool key in
  input order; defaults to the canonical seed.
- `getDecliningOrRetiredTools(records?)` — records whose health is
  `'declining'` or `'retired'`. The Tower uses these as the
  "regression" pressure input.
- `getUngovernedAdoption(records?)` — records whose governance flag
  is `'review_required'` or `'flagged'`. The Tower uses these as the
  "ungoverned adoption" pressure input.

### Tests

[`src/__tests__/integration/tower/ai-adoption-usage.test.ts`](../../../src/__tests__/integration/tower/ai-adoption-usage.test.ts)

69 deterministic tests across the following blocks:

- **Shape & determinism** — ≥ 18 records, byte-equal across calls,
  canonical tuple shape for tools / health / usage / coverage /
  governance, every record carries `createdFrom:
  'deterministic_ai_adoption_seed'`, every id matches the
  `ai-adopt-seed-{tool}-{n}` shape, every id is unique, every record
  has a non-empty `toolName` and `businessFunction`.
- **Tool coverage** — every canonical tool has ≥ 1 record; only
  canonical tool keys are used.
- **Health state coverage** — every canonical health state has ≥ 1
  record; only canonical states are used; only canonical usage
  bands are used.
- **Per-row invariants** — every record has ≥ 1 workflow covered;
  `activeUsers` and `potentialUsers` are non-negative integers and
  active ≤ potential; `adoptionRate === activeUsers /
  potentialUsers` (rounded to 4 decimals); coverage status and
  governance flag are canonical.
- **Distribution constraints** — ≥ 6 distinct business functions;
  ≥ 2 records carry `governanceFlag: 'flagged'`; ≥ 1 record per
  health state (`retired`, `declining`, `broad_adoption`,
  `partial_adoption`, `piloting`, `not_started`).
- **Summary reconciliation** — `byTool`, `byHealth`, and
  `byUsageVolume` reconcile to `totalRecords`; every canonical key
  is present (zero allowed); `totalActiveUsers` and
  `totalPotentialUsers` agree with their defining sums;
  `uniqueBusinessFunctions` and `uniqueWorkflows` are sorted
  ascending and de-duplicated; no-arg call summarizes the canonical
  seed.
- **Helper behaviors** — `getAiAdoptionByTool` returns only the
  matching tool and defaults to the canonical seed;
  `getDecliningOrRetiredTools` and `getUngovernedAdoption`
  partition the inventory correctly and default to the canonical
  seed.
- **No fabrication** — `JSON.stringify(records)` never carries a
  dollar number, banned placeholder text (`Coming soon`, `TBD`,
  `Lorem ipsum`), or endorsement-style framing (`recommended tool`,
  `best-in-class`, `industry leader`, `we endorse`, `our
  preferred`, `guaranteed roi`).
- **Module hygiene** — module source contains no imports from
  Source / Sentinel / Atlas / Nexus / Agent runtime, auth, or
  supabase; no `Date.now` / `Math.random` / `new Date(` / `fetch(`;
  no `anthropic` / `openai` / `useState` / `useEffect`; no banned
  placeholder text.

### Manifest updates

- [`docs/build/build-slices.json`](../build-slices.json) gains an
  `ACT3` entry (category `ACT`, status `code_complete`, risk `low`,
  `dependsOn: ["ACT2"]`).
- [`docs/build/production-readiness.json`](../production-readiness.json)
  gains a note on the `ai_control_tower` component acknowledging the
  ACT3 adoption / usage dimension. The component is **not promoted**;
  status is preserved.

---

## B. Why this slice exists

The AI Control Tower contract names seven canonical dimensions. The
second dimension — **AI Adoption & Usage** — answers the question
"how broadly is the enterprise actually using the AI tooling it has
licensed?"

Atlas cannot frame "where adoption stands" until adoption has a
deterministic shape. Sentinel cannot detect adoption regressions or
ungoverned shadow adoption until the read model exists. Steward
cannot capture per-tenant adoption telemetry against a stable
contract until that contract is canonical.

ACT3 establishes that shape. Once the read model is canonical,
ACT4–ACT8 layer value / risk / cost / productivity / readiness onto
the same identifier space. ACT9 composes the Atlas brief from the
seven dimension read models. ACT10 implements the surface.

This slice is **deliberately deterministic and seed-only** so that
later slices land against a stable contract.

---

## C. Distribution shape (test-enforced)

The seed contains 19 deterministic records distributed across all
ten tools and all six health states. The minimums enforced by the
test suite are:

- ≥ 18 records.
- ≥ 1 record per canonical tool (10 tools).
- ≥ 1 record per canonical health state (6 states).
- ≥ 6 distinct business functions.
- ≥ 2 records carry `governanceFlag: 'flagged'`.

Tools covered (canonical order):

| Tool key | Records |
|---|---|
| github_copilot | 2 |
| claude_code | 2 |
| codex | 2 |
| cursor | 1 |
| servicenow_ai_agents | 2 |
| workday_ai_assistant | 1 |
| erp_agents_generic | 2 |
| salesforce_einstein | 2 |
| microsoft_copilot_m365 | 2 |
| custom_internal_agents | 3 |

Business functions covered:

- Customer Support
- Data Engineering
- Engineering
- Finance
- HR
- IT Service Management
- Knowledge Worker Productivity
- Legal
- Operations
- Platform Engineering
- Procurement
- Quality Engineering
- Risk
- Sales

Tests assert ≥ 6; the seed carries 14.

Health state distribution:

| Health state | Count |
|---|---|
| not_started | 2 |
| piloting | 4 |
| partial_adoption | 4 |
| broad_adoption | 4 |
| declining | 3 |
| retired | 2 |

---

## D. Adoption-rate determinism

Every record's `adoptionRate` is computed as `activeUsers /
potentialUsers`, rounded to four decimal places to keep
`JSON.stringify` byte-equal across runs. When `potentialUsers` is
zero, `adoptionRate` is zero (no division-by-zero artifacts in the
serialized output).

The test suite asserts the relationship row-by-row:

```
adoptionRate === Math.round((activeUsers / potentialUsers) * 10000) / 10000
```

This guarantees the rate is never a fabricated literal — it is
always derivable from two other fields the spec already requires.

---

## E. No-fabrication contract

The seed honors the ACT1 §K no-fabrication rules:

1. **No fake dollars.** Tested via `\$\s*\d` regex on the serialized
   inventory.
2. **No fake citations.** No `E-###` evidence id appears in the seed.
3. **No live model claim.** Every record carries
   `createdFrom: 'deterministic_ai_adoption_seed'`. Module source
   has no `anthropic` / `openai` / `fetch(` / `Date.now` /
   `Math.random` / `new Date(`.
4. **No vendor endorsements.** Vendor names appear only in the
   `tool` key (machine-readable identifier) and `toolName`
   (descriptive label of what the tool is). They never appear as
   recommendations. The test deny-list scans the serialized seed
   for endorsement-style phrasing such as `recommended tool`,
   `best-in-class`, `industry leader`, `we endorse`, `our
   preferred`, and `guaranteed roi`.
5. **No "industry average" adoption claims.** The seed exposes raw
   counts (`activeUsers`, `potentialUsers`) rather than benchmarked
   percentages.
6. **No "we deliver X% productivity uplift" claims.** Productivity
   is captured by ACT6, not ACT3. ACT3 captures only adoption
   posture.
7. **No silent suppression.** Records that are `not_started`,
   `declining`, `retired`, `flagged`, or `none`-volume honestly
   carry that state. The `getDecliningOrRetiredTools` and
   `getUngovernedAdoption` helpers exist specifically so the Tower
   surface can render "regression" and "ungoverned adoption"
   pressure cards instead of an inflated rollup.

---

## F. What this slice does NOT do

- **No Atlas brief composition.** The Atlas Tower brief is composed
  from this read model (and its sibling dimension read models) in
  ACT9. ACT3 emits no prose framing.
- **No Tower UI.** The `/tenant/{tenantKey}/tower` surface is built
  in ACT10. ACT3 has no JSX, no React components, no DOM.
- **No connector binding.** The seed is the only data source.
  ACT3.x follow-up slices replace the seed with a connector-backed
  projection (Steward-owned).
- **No tenant scoping.** The seed is cross-tenant by design — it is
  an **adoption shape** rather than a per-tenant adoption snapshot.
  Per-tenant binding happens in ACT3.x once Steward captures
  adoption telemetry per tenant.
- **No persistence.** No supabase, no migrations, no Drizzle, no
  JSON file write.
- **No tests against React, DOM, or runtime APIs.** Integration
  coverage is purely deterministic.
- **No model calls.** No `anthropic`, no `openai`, no `fetch`, no
  network at all.

---

## G. Future ACT3.x follow-up

These items are explicitly deferred:

- **ACT3.1 — Per-tenant adoption telemetry binding.** Replace the
  seed with a Steward-captured, per-tenant adoption snapshot while
  preserving the read model contract.
- **ACT3.2 — Adoption regression detection.** Sentinel observes
  declining adoption health and emits a pattern; the Tower surfaces
  regression as a pressure card.
- **ACT3.3 — Ungoverned adoption escalation.** Steward surfaces
  records where adoption has spread beyond review; Atlas refuses
  to advance Tower brief content until governance posture is
  captured.
- **ACT3.4 — Workflow coverage scoring.** A scorecard surfaces the
  proportion of intended workflows covered per tool and per
  business function.

---

## H. Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/tower/ai-adoption-usage.test.ts`
  — 69 passed.
- `npm run build` — pass (run alongside the slice's own validation).
- `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"`
  — pass.

---

## I. Status

Code complete. Pending founder review for promotion to `verified`.
Conservative — does not promote any production-readiness component.
