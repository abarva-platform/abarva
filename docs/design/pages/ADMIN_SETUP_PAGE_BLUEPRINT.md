# Admin · Setup Page Blueprint

Slice ID: DES1 / Admin Setup blueprint
Document type: page-level design contract.
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

This blueprint governs the Admin / Setup surface — the **Steward-led
control plane** for AbarVa. It implements the ADM1 product contract
visually. Reads in the `ABARVA_VISUAL_CANON.md` direction;
implementations must conform to both.

Admin / Setup is **not** "settings." It is the surface where an
operator answers in under three seconds: *Is this tenant ready?*
*What is the next leveraged action?*

---

## 1. Surface scope

| Route | Purpose |
|---|---|
| `/platform/admin` | Steward Setup Control Center landing — Steward Brief, readiness cards, recommended actions, dataset explorer, object inspector slot. |
| `/platform/admin/build-progress` | Founder Build Progress dashboard (already live; preserved). |
| `/platform/admin/users` · `/connectors` · `/audit` · `/quality` · existing sub-routes | Drillable per-module surfaces; evolve to ADM5 / ADM6 / ADM9 contracts. |

The landing surface today (`/platform/admin`) is partially live via
ADM2 + ADM4. ADM5 / ADM6 / ADM7 / ADM8 / ADM9 / ADM10 lift the
remainder. This blueprint is what those slices implement.

---

## 2. Steward Brief

The Steward Brief is the **page voice**. It anchors the top of the
landing surface, immediately under Zone A's tenant header.

### Required fields (ADM2 contract, restated)

- `title` · `<workspace> · Steward setup brief`
- `tenantSetupHealth` · `{ label, rationale }` (ready / partial /
  blocked + one-line basis)
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

- Same panel shell as Atlas / Sentinel briefs (canon §H).
- 3px left border in **muted ink** (`#0F0E0D` on `surface2`) — Steward
  is the utility-clerical voice; never amber, never red unless the
  setupHealth is `blocked`.
- Severity chip top-right (`health · ready / partial / blocked`).
- Recommended next action panel renders in a dashed-border `surface2`
  callout below the brief lines.
- Three disabled "Ask Steward" follow-up chips with sub-label
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

### Apple-like rules (canon §E)

- **Calm hierarchy** — one headline metric per zone.
- **Progressive disclosure** — brief → cards → explorer → inspector.
- **Click-to-explore** — every chip / count / module routes
  somewhere.
- **Visual status before tables** — chip + accent reads first.
- **Fix-next guidance** — every gap shows a recommended action.
- **No noisy admin clutter** — empty buckets collapse.
- **Every panel has a Steward interpretation.**
- **Every issue has a recommended next action.**

---

## 4. Dataset domain readiness

The Datasets readiness card (Zone C) and the Dataset Explorer panel
(Zone D, ADM4) surface the same canonical 12 enterprise dataset
domains.

### Zone C card

- 4 mini-stats: ready · partial · not_started · blocked.
- Top 4 domains listed with status chips.
- "open →" affordance routes to ADM4 explorer below or `/admin/data`.

### Zone D explorer (ADM4)

- Header: 3 calm stats (`loaded` · `available` · `usable`).
- Grid: 12 domain rollup cards in canonical ordinal order. Each
  card carries:
  - Ordinal (`01` – `12`) mono uppercase.
  - Status chip (ready / partial / not_started / blocked).
  - Domain name (serif).
  - 3-cell stat grid (`loaded` / `avail` / `usable`).
  - Blocked + orphan callouts (red / amber).
  - "Top: <name>" hint when a top item exists.
- Collapsible "Show all datasets · N" detail with the full ADM3 row
  schema.
- Honest object-inspector placeholder until the inspector slice
  lands.

### Forbidden

- Tables of all 30 dataset rows above the readiness cards.
- Adding a 13th dataset domain without a canon revision.
- Hiding `not_started` domains (they must surface honestly).

---

## 5. Loaded / available / usable evidence

The single most important distinction in Admin (canon §J of ADM1).
Every dataset surface respects the nine canonical states:

```
loaded → parsed → indexed → classified → scoped → cited → quality_checked → usable_as_evidence
                                                                        ↘ blocked
```

### Per-row visual treatment

- Each dataset row (in the explorer detail) carries a usability
  chip — accent color shifts from amber (loaded / parsed) to teal
  (cited / quality_checked / usable_as_evidence) to red (blocked).
- The row's left border accent matches the chip color.
- Per-state agent-usage rules (ADM1 §J) govern the
  `agentsAllowedToUse` chips — blocked rows show only Steward;
  fully usable rows show all four agents.

### Aggregate visual treatment

- Zone C evidence-readiness card shows `loaded` / `available` /
  `usable` totals + a 9-row mini-table of state counts.
- Zone D dataset explorer header shows the same three totals as
  large stat chips.
- Both reconcile to the ADM3 inventory's summary; never re-derived.

---

## 6. Users / access / governance / connectors

These are **portals** in Zone C and **drillable surfaces** in
ADM5 / ADM6 / linked routes.

### Zone C cards (current ADM2 state)

- **Users + access** card — one-sentence `userSecurityRisk` + "open
  →" route to `/platform/admin/users`.
- **Connectors** card — one-sentence `connectorRisk` + "open →"
  route to `/platform/admin/connectors`.

### Future per-module surfaces (ADM5 / ADM6 / linked)

- **Users & Access** (ADM5) — list of users, roles, tenant scope,
  pending invites, last activity, risky permissions, cross-tenant
  exposure callout. Every row carries a Steward action verb.
- **Security & Governance** (ADM6) — tenant isolation state, role
  policy, upload policy, model-call policy, evidence/citation
  policy, audit policy, data retention posture, decision-gate
  policy, governance gaps.
- **Connectors** — list of connectors with status (healthy /
  degraded / stale / failed / unconfigured), last-success
  timestamp, evidence-conversion-readiness fraction, agent
  usability flags.

### Honest fallbacks

- Connectors today honestly read "0 of 0 connectors are wired
  today; live connector sync is deferred." (ADM2).
- Users honestly surface dormant high-privilege accounts; never
  hide them.
- Governance posture honestly names unresolved gaps with named
  owners.

---

## 7. Agent Readiness Matrix

The Agent Readiness card (Zone C) and the future ADM7 drilldown
implement the canonical four-agent matrix.

### Zone C card

- Eyebrow: `nexus · sentinel · atlas · steward`.
- One row per agent in canonical order:
  - Agent name + status chip (ready / partial / blocked) in mono
    uppercase.
  - One-sentence next admin action.
- Click → ADM7 drilldown (when that slice lands).

### ADM7 drilldown (future)

- Per-agent panel showing the canonical five-field readout:
  - status (ready / partial / blocked)
  - canUse list
  - missingContext list
  - safeToAnswer list
  - mustDefer list
  - nextAdminAction
- Link out to the relevant module that unblocks the agent.

### Constraints

- Atlas / Steward / Sentinel / Nexus only. Never a fifth agent.
- Status colors match canon §H accent partition.
- Status chips never animate.

---

## 8. Dataset explorer

ADM4 ships the dataset explorer as Zone D's primary affordance.
This blueprint extends it — no contract change.

### Visible today (ADM4)

- 12 domain rollup cards.
- Collapsible "Show all datasets" detail with full row schema.
- Honest object-inspector placeholder.

### Deferred (future slices)

- Object inspector drawer (single dataset full detail with lineage,
  dependent objects, history, recommended Steward action).
- Filter / search / sort UI on the rows.
- Live link to ADM5 (data owner assignment in-place).
- Live link to per-program evidence usability drilldown (ADM9).

### Forbidden

- Showing the row detail above the rollup cards.
- Implying a live connector sync inside the explorer (every row
  honestly reports `connector: null` today per ADM3).
- Inventing dollar amounts in the explorer.

---

## 9. Acceptance criteria

An Admin / Setup implementation slice is `verified` when:

1. `/platform/admin` boots on the Steward Setup Control Center
   surface (default-selected sidebar item).
2. Steward Brief renders at the top of the page with the canonical
   ADM2 field set.
3. Recommended next action routes to a real admin sub-page.
4. Three "Ask Steward" follow-up chips render disabled with sub-
   label `deferred · live steward runtime`.
5. Five readiness cards render in Zone C: dataset domains · evidence
   readiness · users + access · connectors · agent readiness.
6. ADM4 dataset explorer renders below the readiness cards in Zone
   D, with 12 domain rollups in canonical ordinal order.
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
13. Existing admin sub-routes (Maestros · Roles · Security · Active
    Clients · Contract Terms · Sensitive Data Approvals · Quality
    Ops · Access Logs · Pending Requests · Audit Log · API Keys ·
    Compliance) remain navigable.
14. No surface invents a dollar amount or claims a real `E-###`
    citation.
15. No surface implies a live runtime; deterministic-source
    captions visible at every panel footer.
