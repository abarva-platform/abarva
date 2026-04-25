# Admin · Setup Page Blueprint

Slice ID: DES1 / Admin Setup blueprint
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

This blueprint governs the Admin / Setup surface — the **Steward-led
control plane** for AbarVa. Implements the ADM1 product contract
visually. Reads in `ABARVA_VISUAL_CANON.md`.

Admin / Setup is **not** "settings." It is the surface where an
operator answers in under three seconds: *Is this tenant ready?*
*What is the next leveraged action?*

---

## 1. Surface scope

| Route | Purpose |
|---|---|
| `/platform/admin` | Steward Setup Control Center landing — Steward Brief, readiness cards, recommended actions, dataset explorer, object inspector slot. |
| `/platform/admin/build-progress` | Founder Build Progress dashboard (existing; preserved). |
| `/platform/admin/users` · `/connectors` · `/audit` · `/quality` · existing sub-routes | Drillable per-module surfaces. |

The landing surface today (`/platform/admin`) is partially live via
ADM2 + ADM4. ADM5 polishes it visually. ADM6 / ADM7 / ADM8 / ADM9 /
ADM10 lift the remainder.

---

## 2. Steward Brief (hero)

Anchors the top of the landing surface, immediately under Zone A's
tenant header.

### Required fields (ADM2 contract)

- `title` · `<workspace> · Steward setup brief`
- `tenantSetupHealth` · `{ label, rationale }`
- `topAdminGaps` · ordered list with route hrefs
- `dataEvidenceReadiness` · single sentence
- `userSecurityRisk` · single sentence
- `connectorRisk` · single sentence
- `agentReadiness` · sentence per agent (Nexus / Sentinel / Atlas /
  Steward)
- `recommendedNextAction` · single most-leveraged action with route
- `suggestedFollowUps` · exactly three deterministic disabled chips
- `sourceLabel` · `deterministic_seed` or `setup_state_read_model`
- `interpretationBasis` · single line

### Visual treatment

- Light `card` surface (Steward is utility-clerical — no dark hero).
- 3px **left** border in `MUTED` for ready / partial; flips to RED
  when `setupHealth: blocked`.
- Eyebrow: `Steward · setup state read model` mono.
- Title: H3 (DM Sans 600, `INK`).
- Health chip top-right (NAVY / AMBER / RED).
- Recommended next action panel renders in a dashed-border
  `surface2` callout below the brief lines.
- Three disabled "Ask Steward" chips with sub-label
  `deferred · live steward runtime`.
- Footer caption echoes interpretation basis.

---

## 3. Apple-like control plane

The landing surface is **calm, visual, drillable**. Five canonical
zones from ADM1 §F:

```
┌─────────────────────────────────────────────────────────────┐
│ A · Admin header / setup health                             │
├─────────────────────────────────────────────────────────────┤
│ B · Steward Brief                                           │
├─────────────────────────────────────────────────────────────┤
│ C · Readiness cards                                         │
│   · Dataset domains · Evidence readiness · Users + access   │
│   · Connectors · Agent readiness                            │
├─────────────────────────────────────────────────────────────┤
│ D · Dataset Explorer + Recommended actions + Modules        │
├─────────────────────────────────────────────────────────────┤
│ E · Object inspector slot (honest empty placeholder)        │
└─────────────────────────────────────────────────────────────┘
```

Apple-like rules: calm hierarchy, progressive disclosure,
click-to-explore, visual status before tables, fix-next guidance,
no noisy admin clutter. Every panel has a Steward interpretation;
every issue has a recommended next action.

---

## 4. Dataset domain readiness

The Datasets readiness card (Zone C) and the Dataset Explorer panel
(Zone D, ADM4) surface the same canonical 12 enterprise dataset
domains.

### Zone C card

- 4 mini-stats: ready · partial · not_started · blocked.
- Top 4 domains listed with status chips.
- "open →" affordance routes to ADM4 explorer below or
  `/admin/data`.

### Zone D explorer (ADM4)

- Header: 3 calm stats (`loaded` · `available` · `usable`).
- Grid: 12 domain rollup cards in canonical ordinal order. Each
  card:
  - Ordinal (`01` – `12`) mono uppercase.
  - Status chip (ready / partial / not_started / blocked) in
    NAVY / AMBER / mutedSoft / RED.
  - Domain name (DM Sans 600).
  - 3-cell stat grid (loaded / avail / usable).
  - Blocked + orphan callouts (RED / AMBER).
  - "Top: <name>" italic caption.
- Collapsible "Show all datasets · N" detail with the full ADM3 row
  schema.
- Honest object-inspector placeholder.

---

## 5. Loaded / available / usable evidence

Every dataset surface respects the nine canonical states (ADM1 §J):

```
loaded → parsed → indexed → classified → scoped → cited → quality_checked → usable_as_evidence
                                                                        ↘ blocked
```

Per-row visual: usability chip (NAVY for cited / quality_checked /
usable_as_evidence; AMBER for loaded / parsed; RED for blocked).
The row's left border accent matches the chip color. Per-state
agent-usage rules govern the `agentsAllowedToUse` chips.

---

## 6. Users / access / governance / connectors

These are **portals** in Zone C and **drillable surfaces** in
ADM5 / ADM6.

- **Users + access** card: one-sentence `userSecurityRisk` + "open
  →" route to `/platform/admin/users`.
- **Connectors** card: one-sentence `connectorRisk` + "open →" to
  `/platform/admin/connectors`.

### Honest fallbacks

- Connectors today honestly read "0 of 0 connectors are wired today;
  live connector sync is deferred."
- Users honestly surface dormant high-privilege accounts.
- Governance posture honestly names unresolved gaps with named
  owners.

---

## 7. Agent Readiness Matrix

Zone C card and future ADM7 drilldown.

### Zone C card

- Eyebrow: `nexus · sentinel · atlas · steward`.
- One row per agent in canonical order:
  - `AgentBadge` + status chip (ready / partial / blocked).
  - One-sentence next admin action.
- Click → ADM7 drilldown.

Status chip colors: NAVY ready · AMBER partial · RED blocked.

---

## 8. Dataset explorer

ADM4 ships the explorer as Zone D's primary affordance. ADM5
polishes it visually.

### Visible today (ADM4)

- 12 domain rollup cards.
- Collapsible row detail.
- Honest object-inspector placeholder.

### Deferred

- Object inspector drawer.
- Filter / search / sort UI.
- Live link to ADM5 (data owner assignment in-place).
- Live link to ADM9 (per-program evidence usability drilldown).

---

## 9. Acceptance criteria

An Admin / Setup implementation slice is `verified` when:

1. `/platform/admin` boots on the Steward Setup Control Center.
2. Steward Brief renders at the top with the canonical ADM2 field
   set.
3. Recommended next action routes to a real admin sub-page.
4. Three "Ask Steward" chips render disabled with sub-label
   `deferred · live steward runtime`.
5. Five readiness cards render in Zone C: dataset domains ·
   evidence readiness · users + access · connectors · agent
   readiness.
6. ADM4 dataset explorer renders below the readiness cards in
   Zone D, with 12 domain rollups in canonical ordinal order.
7. Per-domain rollup respects loaded ≥ available ≥ usable.
8. Domains with zero loaded items render `not_started` honestly.
9. Connectors card honestly reads `0 of 0 connectors are wired
   today` until live sync lands.
10. Agent readiness card lists all four canonical agents with
    status + next admin action.
11. Object inspector slot (Zone E) renders an honest empty
    placeholder.
12. Build Progress route (`/platform/admin/build-progress`) remains
    accessible from the sidebar.
13. Existing admin sub-routes remain navigable.
14. No surface invents a dollar amount or real `E-###` citation.
15. No surface implies live runtime; deterministic-source captions
    visible at every panel footer.
