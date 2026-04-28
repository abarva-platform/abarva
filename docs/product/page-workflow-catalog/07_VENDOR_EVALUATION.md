# Page · Vendor Evaluation

Status: Canonical (CAT1)
Authored: 2026-04-25

## Page purpose

Vendor Evaluation is the **vendor posture lens** for the AI
portfolio: where operators read vendor concentration, contract risk,
substitutability, and SME alignment across the platform's tools and
suppliers. The page composes Atlas's vendor lens (one of the seven
canonical Tower dimensions) with Sentinel's vendor-concentration
patterns into a single calm canvas. The page reads like a CFO's
vendor report: ranked risk, substitution candidates, contract
exposure — never like a procurement dashboard with charts and
counters.

## Primary user question

"Which vendors are concentrated, contract-risky, or substitutable —
and what should I act on?"

## Primary agent

Atlas (with Sentinel concentration patterns; Steward owns contract
attestation evidence states).

## Route(s)

- `/(maestro)/tower/onboard` — vendor lens variant of the Tower
  onboarding subsurface (current home).
- Future canonical route `/(maestro)/vendors` — **to be defined**
  in the V2 Tower roadmap as a dedicated vendor surface.

## Required data contract / read model

- ACT1 · AI Control Tower Product Contract (vendor posture
  dimension).
- Vendor evaluation read model — **to be defined**. The contract
  must enumerate vendor identity, contract scope, contract end,
  spend tier, capability coverage, SME availability, and
  substitution candidates.
- I1 · Sentinel Pattern Detection read model — for vendor
  concentration patterns (e.g., "single-vendor LLM exposure").
- ADM3 · Dataset Domain Inventory read model — for the Vendor
  domain rollup.

## What the page knows

- Vendor roster: name, capability tier, contract end, spend tier.
- Concentration metric: percent of capability covered by a single
  vendor.
- Contract risk: end-of-contract date, renewal posture, exit
  cost.
- Substitution candidates: deterministic list of alternative
  vendors covering the same capability.
- Cross-link to Sentinel patterns where vendor concentration is
  flagged.
- Linked programs and SMEs depending on each vendor.

## What the page is missing

- Live procurement integration — vendor data is Steward-seeded in
  v2.
- Live spend tracking against contract — out of scope for v2.
- Live substitution scoring (e.g., LLM-driven match) —
  substitution candidates are deterministic in v2.
- Live SME-to-vendor capability matrix — deferred to V2.

## Key user actions

- Read the Atlas vendor brief.
- Inspect a vendor row to see capability coverage, contract end,
  and substitution candidates.
- Click a Sentinel pattern chip → drill into Intelligence with the
  pattern preselected.
- Open a program link → see which programs depend on the vendor.
- Open Steward attestation → confirm contract evidence state.

## Agent actions

- **Atlas** composes the vendor brief, names the highest-risk
  vendor, recommends a single next move (e.g., "open
  substitution review for Vendor X").
- **Sentinel** surfaces vendor-concentration and contract-risk
  patterns; pattern chips link into Intelligence.
- **Steward** owns contract attestation evidence state per vendor.
- **Nexus** does not author here; vendor links into Programs are
  one-way (program → vendor).

## Empty / degraded states

- No vendors seeded → render `EmptyInspector` with caption
  "No vendors registered. Steward seeds vendors via Setup
  Connectors zone."
- No concentration patterns active → omit the pattern strip; show
  vendor table only.
- Substitution candidates unavailable for a vendor → render the
  candidates rail with `EmptyInspector` caption "No substitution
  candidates seeded for this capability."
- Contract end past due → render RED chip "Contract expired —
  Steward attestation required."

## Navigation / drill-down behavior

- Top nav `active="tower"` (Vendor Evaluation is a Tower lens in
  v2; future v3 may promote it to a top-level surface).
- Vendor row click → drill into vendor detail (right-side
  `DetailDrawerShell`).
- Pattern chip click → Intelligence with pattern preselected.
- Program link → Programs with program preselected.
- Substitution candidate click → drill into the candidate vendor
  detail.

## MVP / V1 / V2 scope

- **MVP / V1 — out of scope.** Vendor Evaluation ships in V2.
  MVP / V1 surface vendor posture as one line in the Atlas Tower
  brief only.
- **V2** — full vendor evaluation surface: roster, concentration
  metric, contract risk, substitution candidates, Sentinel pattern
  cross-links, Steward attestation states.

## Visual blueprint reference

- Inherits the Tower visual blueprint chrome
  ([`docs/design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md`](../../design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md))
  for brief + lens chrome. A dedicated Vendor Evaluation blueprint
  is **to be defined** as part of the V2 roadmap.
- Visual canon: [`docs/design/ABARVA_VISUAL_CANON.md`](../../design/ABARVA_VISUAL_CANON.md).
