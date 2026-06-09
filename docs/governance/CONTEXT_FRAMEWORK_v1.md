# CONTEXT_FRAMEWORK_v1 — Canonical "what good looks like" per context dimension

**Status:** locked (v1) · **Code:** `src/lib/context-framework/context-framework-v1.ts`

The single versioned contract every client/pilot template and every synthetic
reference tenant must satisfy. It does not re-implement the upload UI/registry
(`csv-upload-connector` + `template-registry` already do that) — it is the spec
those templates conform to, and the basis for derived answerability (WS-D) and
promotion eligibility (WS-F).

## The 12 canonical dimensions

Organization & Leadership · Financials & KPIs · Systems & Applications ·
Cloud & Infrastructure · Vendors & Contracts · Initiatives & Moves ·
Operating Model · Process & Workflow · Risks & Controls · Artifacts & Evidence ·
Data Platforms & Domains · Value Ledger & Baselines.

## Contract per dimension

Each dimension locks: `requiredEntities`, required `fields`, `allowedSourceTypes`,
`citationRequired`, `sourceBasisRequired`, `confidenceRequired`,
`defaultClassification`, **`idempotencyKey`** (the natural key so updates
supersede instead of duplicating — WS-B), `applicableAgents`, and
`promotionEligibility` (the governed conditions a committed fact must meet to
become a `promotion_candidate` — agent_ready is still earned via the promotion
workflow, never minted from a load).

Two invariants the tests enforce:
- **No value field in any `idempotencyKey`** — so a changed value updates the
  one logical fact (no duplicate active rows).
- **Full evidence chain required for promotion** — `requiresSourceBasis`,
  `requiresIndexedOrRetrievable`, and `requiresCiteRender` are true for every
  dimension.

## How it is used

- **Templates:** the client-fillable upload templates map 1:1 to these
  dimensions; a load is "complete" for a dimension when its `requiredEntities` +
  required `fields` are present.
- **Idempotent load (WS-B):** the `idempotencyKey` defines the `fact_key` so
  re-uploads update/supersede.
- **Derived answerability (WS-D):** "is this dimension answerable" is measured
  against the framework's required content, not a constant.
- **Promotion (WS-F):** `promotionEligibility` is the per-dimension gate behind
  `promotion-evaluator.ts`.

This is intentionally a light lock of the spec; richer per-template field
catalogs and the canonical synthetic templates are layered on in WS-C/WS-E.
