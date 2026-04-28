# ACT5 · AI Risk & Governance Read Model

Slice ID: ACT5
Slice name: AI Risk & Governance Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Application code (deterministic read model + integration
tests). No application UI, no runtime modification, no migrations,
no model calls, no live integrations.

Operationalizes the AI Risk & Governance dimension of the AI Control
Tower contract ([ACT1](./ACT1_AI_CONTROL_TOWER_CONTRACT.md)) by
projecting a deterministic, cross-tenant inventory of AI risk findings
into a typed read model. The Tower will compose this read model into
Atlas brief content, Sentinel pattern surfaces, Steward governance
gates, and audit attestations in later slices (ACT9, ACT10, EVID3.x).
This slice is **types + seed + helpers + tests only**; no surface
binds it yet.

---

## A. What this slice ships

### Module

[`src/lib/tower/ai-risk-governance.ts`](../../../src/lib/tower/ai-risk-governance.ts)

Public types:

- `AI_RISK_GOVERNANCE_DIMENSIONS` (canonical tuple) and
  `AiRiskGovernanceDimension`.
- `AI_RISK_SEVERITIES` and `AiRiskSeverity`.
- `AI_RISK_STATUSES` and `AiRiskStatus`.
- `GOVERNANCE_GATE_OUTCOMES` and `GovernanceGateOutcome`.
- `AiRiskGovernanceFinding`.
- `AiRiskGovernanceSummary`.

Public helpers:

- `buildAiRiskGovernanceFindings()` — returns the canonical seed.
- `summarizeAiRiskGovernance(findings?)` — reconciles totals;
  computes `governanceGatePassRate`; defaults to the canonical seed.
- `getCriticalRiskFindings(findings?)` — `severity === 'critical'`.
- `getUnaddressedFindings(findings?)` — `status === 'unaddressed'`.
- `getHitlRequiredFindings(findings?)` — `hitlRequired === true`.

### Tests

[`src/__tests__/integration/tower/ai-risk-governance.test.ts`](../../../src/__tests__/integration/tower/ai-risk-governance.test.ts)

Deterministic integration suite covering:

- **Shape & determinism** — ≥ 20 findings, byte-equal across calls,
  canonical dimension / severity / status / gate-outcome tuples,
  every finding carries `createdFrom:
  'deterministic_ai_risk_governance_seed'`, every id matches the
  `risk-seed-{n}` shape, every id is unique, every finding has a
  non-empty description and ownerRole.
- **Dimension / status / severity coverage** — every canonical
  dimension, status, and severity has ≥ 1 finding; only canonical
  values are used.
- **Per-row invariants** — every finding has ≥ 1 mitigation entry;
  `hitlRequired` is a strict boolean; `auditableEvidenceIds` is an
  array of `evidence-seed-{n}` ids; `governanceGate` uses only
  canonical outcomes; `programKey` (when present) is non-empty;
  `aiUseCaseKey` (when present) matches the canonical
  `ai-use-case-seed-{n}` shape.
- **Distribution constraints** — ≥ 3 critical findings, ≥ 5 HITL
  required, ≥ 4 with `governanceGate === 'fail'`, ≥ 2 linked to a
  `programKey`, ≥ 2 linked to an `aiUseCaseKey`.
- **Summary reconciliation** — `byDimension`, `bySeverity`, and
  `byStatus` all reconcile to `totalFindings`; every canonical key
  is present (zero allowed); `unaddressedCount` equals
  `byStatus.unaddressed`; `criticalCount` equals
  `bySeverity.critical`; `hitlRequiredCount` equals the count of
  `hitlRequired === true` findings; `governanceGatePassRate` matches
  `(passing findings) / totalFindings` with `0` returned for an
  empty input list and the result confined to `[0, 1]`.
- **Helper behaviors** — `getCriticalRiskFindings`,
  `getUnaddressedFindings`, and `getHitlRequiredFindings` return
  only matching findings, exclude non-matching findings, and default
  to the canonical seed when called with no arguments.
- **No fabrication** — `JSON.stringify(findings)` never carries a
  dollar number, a branded vendor endorsement (`OpenAI`, `Anthropic`,
  `Cohere`, `Mistral`, `Databricks`, `Snowflake`,
  `Microsoft Copilot`, `GitHub Copilot`), or a banned placeholder
  (`Coming soon`, `TBD`, `Lorem ipsum`).
- **Module hygiene** — module source contains no imports from
  Source / Sentinel / Atlas / Nexus / Agent runtime, auth, or
  supabase; no `Date.now` / `Math.random` / `new Date(` / `fetch(`;
  no `anthropic` / `openai` / `useState` / `useEffect`; no banned
  placeholder text.

### Manifest updates

- [`docs/build/build-slices.json`](../build-slices.json) gains an
  `ACT5` entry (category `ACT`, status `code_complete`, risk `low`,
  `dependsOn: ["ACT2"]`).
- [`docs/build/production-readiness.json`](../production-readiness.json)
  gains a note on the `ai_control_tower` and `audit_governance`
  components acknowledging the ACT5 risk governance dimension. No
  component is promoted; statuses are preserved.

---

## B. Why this slice exists

The AI Control Tower contract names ten canonical governance review
surfaces. Atlas cannot frame "where the AI portfolio stands on risk
and governance" until those surfaces have a deterministic shape;
Sentinel cannot detect governance-gate sparsity until findings exist
in a typed shape; Steward cannot route HITL or escalation actions
until ownership and severity are captured.

ACT5 establishes that shape. Once this read model is canonical, ACT9
composes the Atlas brief from this and sibling dimension read models;
ACT10 implements the Tower surface that exposes per-dimension
findings with their ownership, mitigations, and governance-gate
outcomes; EVID3.x links findings to evidence-ledger entries with
support strength.

This slice is **deliberately deterministic and seed-only** so that
later slices land against a stable contract.

---

## C. Distribution shape (test-enforced)

The seed contains **22 deterministic findings** distributed as
follows:

| Dimension | Count |
|---|---|
| responsible_ai_review | 2 |
| privacy_data_protection | 2 |
| security_red_team | 2 |
| legal_contractual | 2 |
| model_risk_management | 2 |
| human_in_the_loop | 3 |
| auditability_and_traceability | 3 |
| regulatory_compliance | 2 |
| third_party_vendor_risk | 2 |
| change_management_risk | 2 |

| Severity | Count |
|---|---|
| low | 3 |
| medium | 9 |
| high | 6 |
| critical | 4 |

| Status | Count |
|---|---|
| unaddressed | 4 |
| in_review | 7 |
| mitigated | 6 |
| accepted | 2 |
| escalated | 3 |

| Governance gate | Count |
|---|---|
| pass | 7 |
| partial | 7 |
| fail | 6 |
| not_run | 2 |

Distribution invariants additionally tested:

- ≥ 20 findings (the seed has 22).
- All 10 dimensions covered (≥ 1 each).
- All 5 statuses represented (≥ 1 each).
- All 4 severities represented (≥ 1 each).
- ≥ 3 critical findings (the seed has 4).
- ≥ 5 findings require human-in-the-loop (the seed has 10).
- ≥ 4 findings carry `governanceGate: 'fail'` (the seed has 6).
- ≥ 2 findings link to a `programKey` (the seed has 4 — two on
  `contact-center-ai`, two on `demand-forecasting`).
- ≥ 2 findings link to an `aiUseCaseKey` (the seed has 8 — including
  the two ACT2 blocked records, two scaled records, and four
  production / pilot records).
- Every finding carries ≥ 1 mitigation entry.

---

## D. No-fabrication contract

The seed honors the ACT1 §K no-fabrication rules:

1. **No fake dollars.** Tested via `\$\s*\d` regex on the serialized
   findings list.
2. **No fake citations.** Linked evidence ids use the canonical
   `evidence-seed-{n}` form so they resolve only against the EVID2
   deterministic ledger.
3. **No live model claim.** Every finding carries
   `createdFrom: 'deterministic_ai_risk_governance_seed'`. Module
   source has no `anthropic` / `openai` / `fetch(` / `Date.now` /
   `Math.random` / `new Date(`.
4. **No vendor brand claims.** Findings reference governance review
   surfaces and roles only; the deny-list scan blocks `OpenAI`,
   `Anthropic`, `Cohere`, `Mistral`, `Databricks`, `Snowflake`,
   `Microsoft Copilot`, and `GitHub Copilot`.
5. **No "industry average" risk claims.** Seed prose describes the
   specific control gap and the named owner role.
6. **No "we deliver X% safety uplift" claims.** Seed prose names
   mitigations and gate outcomes only.
7. **No claim that governance is mature.** Findings honestly carry
   `unaddressed`, `in_review`, `escalated`, or `not_run` states; the
   `getUnaddressedFindings` and `getHitlRequiredFindings` helpers
   exist specifically so the Tower surface can render gaps rather
   than fabricate maturity.
8. **No silent suppression.** Every finding with a critical severity
   is surfaced through `getCriticalRiskFindings`; every unaddressed
   finding through `getUnaddressedFindings`; the
   `governanceGatePassRate` honestly reports the fraction of
   findings whose gate has passed.

---

## E. What this slice does NOT do

- **No Atlas brief composition.** The Atlas Tower brief composes
  this read model (and its sibling dimension read models) in ACT9.
  ACT5 emits no prose framing.
- **No Tower UI.** The `/tenant/{tenantKey}/tower` surface is built
  in ACT10. ACT5 has no JSX, no React components, no DOM.
- **No connector binding.** The seed is the only data source. ACT5.x
  follow-up slices replace the seed with a connector-backed
  projection (Steward-owned).
- **No tenant scoping.** The seed is cross-tenant by design — it is
  a **risk-governance shape** rather than a per-tenant register.
  Per-tenant binding happens in ACT5.x once Steward captures
  findings per tenant.
- **No persistence.** No supabase, no migrations, no Drizzle, no
  JSON file write.
- **No tests against React, DOM, or runtime APIs.** Integration
  coverage is purely deterministic.

---

## F. Future ACT5.x follow-up

These items are explicitly deferred:

- **ACT5.1 — Per-tenant risk register binding.** Replace the seed
  with a Steward-captured, per-tenant findings list while preserving
  the read model contract.
- **ACT5.2 — Governance gate replay.** Persist gate outcome history
  per finding so the Tower can render trend charts and Sentinel can
  detect regressions.
- **ACT5.3 — Mitigation lifecycle.** Helper transitions
  `unaddressed` → `in_review` → `mitigated` → `accepted` (or
  `escalated`), with audit emission per transition.
- **ACT5.4 — Finding-to-evidence supportlinks.** Tighten the
  `auditableEvidenceIds` join with EVID3 claim-support evaluator so
  unsupported critical findings raise their own Sentinel pattern.

---

## G. Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/tower/ai-risk-governance.test.ts`
  — pass.
- `npm run build` — pass.
- `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"`
  — pass.

---

## H. Status

Code complete. Pending founder review for promotion to `verified`.
Conservative — does not promote any production-readiness component.
