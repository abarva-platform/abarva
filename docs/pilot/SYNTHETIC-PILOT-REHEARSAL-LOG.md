# Synthetic Pilot Rehearsal · Northwind Retail · 2026-05-22

A fictional retail tenant ("Northwind Retail") walked end-to-end through every
step a real pilot customer of this shape would experience. Purpose: surface
every gap (UX, content, broken state, missing copy, dead-end flow) before a
real customer is in the room.

- **Synthetic tenant key:** `northwind`
- **Display name:** Northwind Retail
- **Industry:** RETAIL
- **Rehearsal Move:** "Reduce repeat contact-center transfers"
- **Function Pack exercised:** `customer_care` (retail customer-care)
- **Walkthrough script:** [`src/scripts/pilot/walk-synthetic-pilot-northwind.ts`](../../src/scripts/pilot/walk-synthetic-pilot-northwind.ts)
- **Tenant seed:** [`src/scripts/seed/northwind-enterprise.ts`](../../src/scripts/seed/northwind-enterprise.ts)

---

## Executive summary

**The engine is genuinely ready for a real pilot of this shape from the
moment the Move is originated through every kernel-derived artifact.** All 8
board-grade decks (the 4 phase artifacts + the 4 derivative decks) render for
the synthetic Move with real kernel content, honest verdicts, real seed gaps,
and no fabricated `fund` calls. The classifier picks the right Function Pack
from a plausible plain-English brief at the first try. Baseline-metric
reconciliation reports an honest 7-of-12 recorded + 5 named seed gaps.

**Two blockers stop a brand-new tenant from getting onto the engine at all.**

1. **Tenant onboarding has no defined path.** A new tenant key is not
   recognised by `client-config`, `active-client`, `demo-tenant-data-tiers`,
   or the `canonical-auth-roster` — all four are hardcoded enums. There is
   no documented or scripted "add a new tenant" flow, and any tenant key not
   in the enums silently falls back to `apex-retail` via
   `getTenantRouteFallback`. **This is a cross-tenant data-leak risk class,
   not just a UX gap.**

2. **Surfaces other than Moves are sparse-to-empty.** Intelligence has zero
   Northwind content (vs. 56 file mentions for Apex). Source and Tower have
   no tenant entry and would route a Northwind user to Apex's events.

**Beyond those two: minor polish.** One API expects camelCase `industryCode`
where its sibling accepts snake_case too — a real interop gap, but small.
The renderer carries the tenant *industry* ("retail") as the tenant label
when the `clients` row is missing — a fallback artifact of the broken
onboarding, not a renderer bug.

**Gap totals: P0 = 2 · P1 = 3 · P2 = 4 · P3 = 2.**

---

## Step-by-step rehearsal log

### Step 1 — Tenant onboarding / login

**What happened.** The synthetic Northwind tenant key (`northwind`) is
recognised by none of the four registries a brand-new tenant must enter
before any page can render: `ALL_CLIENTS` in `src/lib/client-config.ts`,
`CLIENT_KEY_TO_DB_SLUGS` in `src/lib/active-client.ts`,
`DEMO_TENANT_DATA_TIERS` in `src/lib/tenants/demo-tenant-data-tiers.ts`, and
`CANONICAL_AUTH_EMAILS` in `src/lib/auth/canonical-auth-roster.ts`. There is
no scripted or documented "add new tenant" flow.

**Evidence.**
- `ALL_CLIENTS.id` enum is `meridian | arcturus | apexretail` — closed.
- `CLIENT_KEY_TO_INDUSTRY_CODE` likewise — closed.
- `active-client.ts` `CLIENT_KEY_TO_DB_SLUGS` is hardcoded; an unrecognised
  key returns `DEFAULT_CLIENT_KEY = 'apexretail'`.
- `getTenantRouteFallback('northwind','admin')` → `/tenant/apex-retail/programs`.

**Gap call.** ❌ **broken** — P0.

---

### Step 2 — Setup / admin view for new tenant

**What happened.** `getDemoTenantDataTier('northwind')` returns null. The
admin/Setup surfaces consult this registry; a missing entry means setup has
no idea Northwind exists, and `getTenantRouteFallback` defaults to
`/tenant/apex-retail/programs`. A Northwind user would see Apex Setup chrome.

**Evidence.** `src/lib/tenants/demo-tenant-data-tiers.ts:195` — the literal
fallback string.

**Gap call.** ❌ **broken** — P0 (the same root cause as Step 1).

---

### Step 3 — Originate a Move via `/programs/new`

**What happened.** Submitted brief title "Reduce repeat contact-center
transfers" with a one-paragraph customer-care problem statement. The
classifier (`classifyFunctionKey`) resolved industry `retail` and picked
function `customer_care` with confidence `0.279`. Cleared the 0.18 floor and
the 0.05 margin requirement.

**Evidence.** Walkthrough Step 3 stdout. `customer_care` matches the
intended pack.

**Gap call.** ✅ **works**.

---

### Step 4 — `function_pack_key` + `function_pack_confidence` populate

**What happened.** When called with the camelCase shape
(`industryCode`, `functionPackKey`, `charter`), `resolveMoveFunctionIdentity`
resolves correctly. When called with the snake_case shape (`industry_code`,
`function_pack_key`), it returns null — even though `MoveBusinessCaseInput`
elsewhere accepts both forms.

**Evidence.** `src/lib/programs/function-identity.ts:338` — the resolver
only reads `input.industryCode`, not `input.industry_code`.

**Gap call.** ⚠ **rough but works** — P2 interop inconsistency. Won't bite
DB-row callers (they go through `move-function-binding.ts` which translates),
but will bite any direct consumer that mirrors the row.

---

### Step 5 — Move detail / pack binding

**What happened.** `bindMoveFunctionPack(moveInput, 'business_case')` →
`bound=true`. The pack `Customer care & service operations` carries 12
operating metrics; Northwind records 7 of them; **5 honest seed gaps** are
surfaced by key: `contacts_per_order`, `self_service_resolution_rate`,
`service_level`, `avoidable_contact_share`, `agent_attrition_rate`. The
deliverable outline contains 7 sections with real guidance text — not a
label list.

**Evidence.** Walkthrough Step 5 stdout.

**Gap call.** ✅ **works** — exactly the honest-gap behaviour the spec
calls for. Not too many gaps (binding still useful), not too few (binding
isn't laundered).

---

### Step 6 — Each of the 4 phase-artifact board-grade decks

For each of the 4 routes (`?moveId=<id>`), the renderer was called with the
synthetic Move directly (in-process, bypassing the route's loader). All 4
returned bound decks, real kernel verdicts, and large self-contained HTML.

| Step | Artifact | HTML size | Verdict | Bound? | Gap |
| ---- | -------- | ---------:| ------- | ------ | --- |
| 6.1 | Discover Brief | 68,517 | `no-go` | true | ✅ |
| 6.2 | Costed Business-Case Pack | 86,113 | `kill` | true | ✅ |
| 6.3 | Solution Architecture Pack | 95,694 | `hold` | true | ✅ |
| 6.4 | Mobilize & Go-Decision Packet | 75,373 | `no_go` | true | ✅ |

**Evidence.** [`/tmp/discover-brief-northwind.html`](file:///tmp/discover-brief-northwind.html)
(rendered locally) contains **35 mentions of "seed gap"**, **23 of
"baseline"**, and the pack-bound metric names — no fabricated `fund`
verdict surfaced.

**Gap call.** ✅ **works** — but with two observations carried as P1/P2 below:
- The renderer surfaces the tenant *label* as the industry slug ("retail")
  because no `clients` row exists. With a real `clients` row this would say
  "Northwind Retail". Symptom of the Step-1 blocker, not a renderer bug.
- Four of four verdicts are kill/no-go/hold for a perfectly reasonable
  customer-care brief — the kernel is conservative. This is the intended
  honest-default but worth noting: a first-time customer may not understand
  why every artifact is recommending against funding.

---

### Step 7 — The 4 derivative decks

| Step | Artifact | HTML size | Verdict | Bound? | Gap |
| ---- | -------- | ---------:| ------- | ------ | --- |
| 7.1 | Charter Business-Case Skeleton | 91,024 | `kill` | true | ✅ |
| 7.2 | Estimate & Financial Model | 81,761 | — | true | ✅ |
| 7.3 | CFO Pack | 91,930 | `kill` | true | ✅ |
| 7.4 | Master Move Dossier | 85,386 | `kill` | true | ✅ |

**Sub-finding (rehearsal-only artifact).** `renderMoveMasterDossierHtml`
takes a positional `moveId` argument that the other 7 renderers do not. A
caller mirroring the others' signature crashes with
`Cannot read properties of undefined (reading 'replace')`. This is not a
production bug (the route caller passes it correctly), but it is an API
inconsistency a future implementer will hit.

**Gap call.** ✅ **works** for the production path. ⚠ P2 API
inconsistency on the renderer signature.

---

### Step 8 — Intelligence surface for Northwind

**What happened.** `src/lib/intelligence/` mentions `northwind` zero times,
vs. `apex` 56 times. There is no seed pattern, contradiction, executive
profile, segment, or industry-AI corpus content for Northwind. A real
Northwind user opening `/intelligence` would see either a blanket fallback
(Apex's intelligence) or an empty state.

**Gap call.** 📝 **missing content** — P1. Audit-finding confirmed.

---

### Step 9 — Source / Tower for Northwind

**What happened.** `demo-tenant-data-tiers` carries no Northwind entry. The
`getTenantRouteFallback` would route Northwind Source/Tower requests to
Apex's events (`/source/events/apex-retail-ams-outsourcing-2026`) by
default. That is a cross-tenant content leak class, not just emptiness.

**Gap call.** 📝 **missing content** — P1, with a P0 risk-class concern
folded in.

---

### Step 10 — Phase-1 entry deliverables in `gateLifecycle.ts`

**What happened.** Called `bindMoveFunctionPack` for all 4 phase-artifact
keys (`business_case`, `discover_brief`, `solution_architecture`,
`mobilization_plan`). All 4 bind with real outlines (6-8 sections) and 5
honest seed gaps each. This is the same code path `gateLifecycle.ts` uses
when a charter advances to Phase 1, so phase-entry deliverable generation
inherits real kernel structure rather than improvising it.

**Gap call.** ✅ **works**.

---

## Prioritised gap list

### P0 — blocking core flow (2)

| # | Gap | Where | Recommendation |
| - | --- | ----- | -------------- |
| P0-1 | **No tenant-onboarding path.** A new tenant key requires hand-edits to 4 separate registries; nothing is documented or scripted. Falls back to `apex-retail` silently. | `src/lib/client-config.ts`, `src/lib/active-client.ts`, `src/lib/tenants/demo-tenant-data-tiers.ts`, `src/lib/auth/canonical-auth-roster.ts` | Build a `addTenant({ key, name, industry })` helper (script + checklist). Make the lookups data-driven from a single table. Until then, document the 4-place edit in `docs/TENANT_SETUP_RUNBOOK.md`. |
| P0-2 | **`getTenantRouteFallback` defaults to apex-retail for any unknown tenant.** Cross-tenant leak risk: a Northwind user with metadata mis-pinned would see Apex's Source events. | `src/lib/tenants/demo-tenant-data-tiers.ts:195` | Change the fallback to an explicit empty state, or to a documented "no data yet" page. Never serve another tenant's URL as a default. |

### P1 — significant rough edges (3)

| # | Gap | Where | Recommendation |
| - | --- | ----- | -------------- |
| P1-1 | **Intelligence has no per-tenant content for a brand-new tenant.** | `src/lib/intelligence/*` | Build a "new-tenant intelligence onboarding" wave — at least industry-level seed patterns the new tenant inherits, so the surface is not empty. |
| P1-2 | **Source / Tower have no per-tenant entry path.** | `src/lib/tenants/demo-tenant-data-tiers.ts` | Same as P0-2 plus: add an explicit "no source events for this tenant yet" panel to the Source list page. |
| P1-3 | **Renderer falls back to industry slug for tenant label** when the `clients` row is missing. A real Northwind user (post-onboarding) would see "Northwind Retail"; in our rehearsal it says "retail". Confirms the kernel-derived path is correct once Step-1 is solved. | `src/lib/programs/expert-kernel/exports/board-grade/*` model files | Audit how `tenantLabel` is derived in each model; ensure the canonical display name from `client-config.canonicalClientDisplayName` is preferred over the industry slug. |

### P2 — polish (4)

| # | Gap | Where | Recommendation |
| - | --- | ----- | -------------- |
| P2-1 | `resolveMoveFunctionIdentity` only accepts camelCase `industryCode`. `MoveBusinessCaseInput` elsewhere accepts both `industry_code` and `industryCode`. Quiet `null` return. | `src/lib/programs/function-identity.ts:338` | Accept both shapes — one-line fix. |
| P2-2 | `renderMoveMasterDossierHtml` is the only board-grade renderer that takes a positional `moveId`. | `src/lib/programs/expert-kernel/exports/board-grade/move-master-dossier-renderer.ts:830` | Make `moveId` optional with a deterministic fallback, or harmonise the other 7 renderers to take it. |
| P2-3 | Conservative kernel returns kill/no-go/hold on every derivative for a plausible brief. No copy on the deck explains "why everything says kill" to a first-time customer reading them. | `src/lib/programs/expert-kernel/exports/board-grade/*` | Add a one-line explainer chip when verdict is kill/no-go citing the dominant cause (e.g. "seed-gap blocks monetisation"). |
| P2-4 | Origination classifier's confidence of 0.279 is *just* above the 0.18 floor — a Move with a slightly looser brief would fail to classify even when the function is obvious. | `src/lib/programs/function-identity.ts:105` | Consider weighting the pack's `functionLabel` even more heavily, or surfacing the "unbound — try again with more detail" path to the user rather than a silent classification failure. |

### P3 — nice-to-haves (2)

| # | Gap | Where | Recommendation |
| - | --- | ----- | -------------- |
| P3-1 | No "synthetic pilot rehearsal" CI gate. The script in this PR is one-shot; running it as a smoke test against each PR would catch tenant-registry drift early. | `.github/workflows/` (out-of-scope for this PR — Codex on Layer 1) | Add a `test:synthetic-pilot` script to `package.json` and a CI job. |
| P3-2 | The walkthrough log is markdown; a real customer journey would benefit from per-step HTML excerpts archived under `docs/pilot/evidence/`. | n/a | Capture artefact HTMLs as part of the script run. |

---

## How ready is the engine for a real pilot of this shape?

**Once Step-1 onboarding is solved, the Moves engine is shippable for a
real pilot.** Every kernel-derived deck — phase artifacts and derivative
decks — produces real, honest, pack-bound content. Seed gaps are precise.
Verdicts are conservative but truthful. Phase-1 entry deliverables inherit
real outlines.

**Without solving Step-1, the pilot cannot start.** A new tenant has no
path onto the surface; setup falls back to Apex; Source/Tower would leak
Apex content; Intelligence would be empty.

**Top-3 recommendations.**
1. **Land a tenant-onboarding script** (P0-1) — the single highest-leverage
   change. One file's worth of work, unblocks every new pilot.
2. **Make `getTenantRouteFallback` honest** (P0-2) — never serve another
   tenant's URL as a default; replace with an empty-state page.
3. **Inherit industry-level Intelligence content** (P1-1) — even thin
   industry-default patterns are better than an empty surface for a
   first-time visitor.

---

## Walkthrough output (verbatim)

The full output of
`npx tsx src/scripts/pilot/walk-synthetic-pilot-northwind.ts` is reproduced
below for reproducibility.

```
--- Step 1: Tenant onboarding / login for new tenant key [broken] ---
client-config.ALL_CLIENTS recognises 'northwind' key: false
active-client.ts slug map mentions northwind: false
CLIENT_KEY_TO_INDUSTRY_CODE has entries for: meridian, arcturus, apexretail
canonical-auth-roster does not include a Northwind admin email
tenant-onboarding for a brand-new key requires: (1) row in clients table, (2) addition to client-config, (3) email in canonical-auth-roster, (4) row in demo-tenant-data-tiers

--- Step 2: Setup / admin view for new tenant [broken] ---
getDemoTenantDataTier('northwind') → NULL
getTenantRouteFallback('northwind','admin') → /tenant/apex-retail/programs
Setup currently does not know Northwind exists; admin route falls back to '/tenant/apex-retail/programs'.
Fallback hardcoding to apex-retail is a known coverage gap for any new tenant.

--- Step 3: Originate Move via /programs/new — classifier picks function [ok] ---
Industry resolved to 'retail'. Classifier picked function='customer_care' with confidence=0.279. Matches the intended pack.

--- Step 4: function_pack_key + function_pack_confidence populated [ok] ---
Resolved identity: industryKey='retail', functionKey='customer_care'. function_pack_confidence=0.279. NOTE: resolveMoveFunctionIdentity expects camelCase 'industryCode' — snake_case 'industry_code' silently returns null. MoveBusinessCaseInput accepts both forms; this resolver does not. Minor interop gap.

--- Step 5: Move detail / pack binding (customer_care) [ok] ---
bound=true
pack.functionLabel='Customer care & service operations'
expectedMetrics=12
seedGaps=5 (the metrics Northwind does NOT yet record)
seed-gap keys: contacts_per_order, self_service_resolution_rate, service_level, avoidable_contact_share, agent_attrition_rate
fallbackNote: (none)

--- Step 6.1: Discover Brief — board-grade [ok] ---
bound=true · verdict=no-go · html size=68,517 chars

--- Step 6.2: Costed Business-Case Pack — board-grade [ok] ---
bound=true · verdict=kill · html size=86,113 chars

--- Step 6.3: Solution Architecture Pack — board-grade [ok] ---
bound=true · verdict=hold · html size=95,694 chars

--- Step 6.4: Mobilize & Go-Decision Packet — board-grade [ok] ---
bound=true · verdict=no_go · html size=75,373 chars

--- Step 7.1: Charter Business-Case Skeleton — derivative [ok] ---
bound=true · verdict=kill · html size=91,024 chars

--- Step 7.2: Estimate & Financial Model — derivative [ok] ---
bound=true · html size=81,761 chars

--- Step 7.3: CFO Pack — derivative [ok] ---
bound=true · verdict=kill · html size=91,930 chars

--- Step 7.4: Master Move Dossier — derivative [ok] ---
bound=true · verdict=kill · html size=85,386 chars

--- Step 8: Intelligence surface for Northwind [missing] ---
src/lib/intelligence files mentioning 'northwind': 0
same dir, 'apex': 56 (for comparison)
Intelligence has NO Northwind-specific seed, segments, contradictions, or executive profiles. A real customer would see a sparse or empty surface.

--- Step 9: Source / Tower for Northwind [missing] ---
getDemoTenantDataTier('northwind') → NULL
No demo-tenant-data-tiers entry means Source and Tower routes have no caveat / availability bound to Northwind; surfaces fall back to apex-retail or show a generic empty state.
Risk: a real Northwind user would see Apex-tenant Source events via the getTenantRouteFallback default. Cross-tenant leak class.

--- Step 10: Phase-1 entry deliverables (gateLifecycle bindings) [ok] ---
business_case: bound=true, outline=7 sections, seedGaps=5
discover_brief: bound=true, outline=8 sections, seedGaps=5
solution_architecture: bound=true, outline=6 sections, seedGaps=5
mobilization_plan: bound=true, outline=7 sections, seedGaps=5

══════════════════════════════════════════════════════════════
  Synthetic Pilot Rehearsal · Northwind Retail · final tally
══════════════════════════════════════════════════════════════
  OK       : 12
  WARN     : 0
  BROKEN   : 2
  MISSING  : 2
  total    : 16
══════════════════════════════════════════════════════════════
```
