# Page Data Contract Standard

Status: Canonical (CAT1)
Authored: 2026-04-25
Type: Cross-page standard. Documentation only — no application
code, no runtime modification, no migrations, no model calls.

This document defines the **shape every page-level read model must
satisfy** to back a canonical AbarVa surface. The standard is
composed from the build-slice contracts (S1 / S2 / S8 / S9 series /
PDEL / I1 / I2 / I3 / I4 / ACT1 / ADM1 / ADM3 / ADM4 / MW1 / MW2 /
PF2 / SOL1 / SOL2). Any new page surface must satisfy this contract
before implementation begins.

---

## A. Why a single standard

Every page in this catalog answers a clear user question, is backed
by a read model, and exposes what the agent knows / what is missing
/ what action should happen next. The five product rules in
`00_PAGE_WORKFLOW_CATALOG_MASTER.md` are non-negotiable. A
read-model contract is the discipline that lets engineering deliver
those rules deterministically — without inventing data, without
shipping a "live" page that quietly degrades to mock state.

---

## B. The six required fields

Every page-level read model must expose these six top-level fields.
A field is "present" if it is typed, deterministic, and a build
test exercises it.

### 1. `pageQuestion: string`

The single primary user question the page exists to answer. One
line, ≤ 120 characters. Sourced from the per-page catalog file's
"Primary user question" section.

### 2. `primaryAgent: AgentKey`

The single anchor agent for the surface — exactly one of `nexus` /
`sentinel` / `atlas` / `steward`. The page's brief panel and
recommended action originate here.

### 3. `whatThePageKnows: PageKnowsRow[]`

A typed list of deterministic inputs the agent has composed for the
page. Each row carries:

- `key: string` — stable identifier.
- `label: string` — human-readable label.
- `value: number | string | null` — deterministic value (`null`
  when not seeded).
- `sourceContractId: string` — the contract / read model that
  produced the value (e.g., `"S9F"`, `"ADM3"`, `"I1"`).

### 4. `whatThePageIsMissing: PageMissingRow[]`

A typed list of inputs the agent does **not** have yet. Each row
carries:

- `key: string`
- `label: string`
- `reason: string` — a one-line explanation of why the input is
  missing.
- `unblockedBy: AgentKey | null` — the agent that can unblock the
  input (commonly `steward`).

### 5. `recommendedNextAction: RecommendedAction | null`

The single executable next move the agent recommends. `null` when
no action is appropriate. The shape:

- `verb: string` — single executable verb-led phrase.
- `targetHref: string` — internal route to act on.
- `targetEntityKind: "program" | "pattern" | "evidence" | "vendor"
  | "dataset" | "user" | "policy" | "deliverable" | "workshop"`.
- `targetEntityId: string` — stable id of the entity to act on.

### 6. `basis: PageBasis`

The deterministic basis of the page's content:

- `kind: "deterministic_seed" | "live_runtime" | "external_basis"
  | "mixed_basis"`.
- `sourceCaption: string` — caption to render in any drawer footer
  on the page (e.g., `"S9G deterministic seed · v0.4"`).

---

## C. Forbidden fields

A read model must **not** include these:

- Free-text agent narrative — the brief is generated from typed
  fields, not from a string the runtime composed via LLM.
- Live model invocation hooks — the read model is pure.
- Untyped JSON blobs — every field is typed.
- Date.now / Math.random / new Date() — determinism is enforced.
- Tenant-cross-cutting state — read models are tenant-scoped.

---

## D. Honest fallback rules

When inputs are missing, the read model degrades honestly:

- If `whatThePageKnows` is empty → page renders an `EmptyInspector`
  with a Steward-seeding caption.
- If `recommendedNextAction` is `null` → the brief renders without
  the recommendation chip; it does not invent one.
- If `basis.kind` is `external_basis` → every brief / pattern card
  on the page renders the AMBER "external basis" chip and a
  disclosure footer.
- If a field's value is `null` → the surface hides the field
  rather than rendering `—`. Empty data walls are forbidden.

---

## E. Cross-link contract

When a page row links into another surface, it must carry:

- `targetSurface: "programs" | "intelligence" | "tower" |
  "source" | "admin" | "vendors"`.
- `targetEntityKind` and `targetEntityId` (per §B.5).
- `linkAffordance: "row_drilldown" | "drawer" | "navigate"` —
  determines whether the click stays on the page (drawer) or
  navigates (navigate).

Modal dialogs are forbidden as detail surfaces; the choices are
drawer (same-canvas) or navigate (new page).

---

## F. Read-model location convention

Page-level read models live under `src/lib/<domain>/` per the
build-slice convention:

| Page | Read model module(s) |
| --- | --- |
| Home | `src/lib/tower/` (Atlas brief) — unified Home read model **to be defined**. |
| Setup | `src/lib/admin/dataset-domain-inventory.ts` plus future Steward brief module. |
| Programs | `src/lib/programs/program-readiness-summary.ts`, `src/lib/programs/program-artifact-inventory.ts`. |
| Program Workshop Mode | `src/lib/programs/workshop-readiness.ts`, `src/lib/programs/program-artifact-inventory.ts`. |
| Source | `src/lib/source/agent-context.ts`, `src/lib/source/context-quality.ts`. |
| Source · Artifacts/Reviews/Approvals | Source review read model **to be defined**. |
| Vendor Evaluation | Vendor evaluation read model **to be defined** (V2). |
| Intelligence | `src/lib/intelligence/sentinel-pattern-detections.ts`, plus I2 / I3 / I4 modules. |
| AI Control Tower | `src/lib/tower/` (Atlas brief, scorecards, pressure cards, lens). |
| Data / Evidence / Knowledge | `src/lib/admin/dataset-domain-inventory.ts` and Knowledge library module **to be defined** (V1). |

---

## G. Test discipline

Every page-level read model carries a deterministic integration test
(`src/__tests__/integration/<domain>/<module>.test.ts`) covering:

- Determinism (byte-equal output across repeated calls).
- Required field-set per row.
- Reconciliation: aggregate counts equal sum of underlying rows.
- Honest fallback: unseeded inputs produce typed `null` or empty
  arrays, never invented values.
- Module hygiene: no imports from disallowed runtime modules
  (Source UI, Sentinel / Atlas / Nexus / Agent runtime, legacy
  `/programs`, `mock.ts`, auth, supabase). No `Date.now` /
  `Math.random` / `new Date()`.

---

## H. Acceptance criteria

A page-level read model is contract-compliant when:

1. The six required fields (§B) are present and typed.
2. None of the forbidden fields (§C) are present.
3. Honest fallback rules (§D) are exercised by tests.
4. Cross-link rows carry `targetSurface` / `targetEntityKind` /
   `linkAffordance` (§E).
5. The module lives under the canonical location (§F).
6. Determinism, field-set, reconciliation, fallback, and module
   hygiene tests (§G) all pass.
7. The catalog file for the page (`01_…` through `10_…`) cites
   this standard.
