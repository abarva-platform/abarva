# Admin Setup Page · Visual Blueprint (DES1)

Status: Canonical (DES1)
Authored: 2026-04-25

The Admin Setup surface is **Steward's room**: where governance,
identity, dataset readiness, and connectors live. Setup must read
like the System Settings panel of a premium operating system —
calm, exhaustive, drillable, never noisy.

This blueprint binds the AbarVa Visual Canon to the Admin
read-models defined by ADM1 / ADM2 / ADM3 / ADM4.

---

## Page structure

```
┌───────────────────────────────────────────────────────────────┐
│ AbarVaTopNav (active=admin)                                   │
├───────────────────────────────────────────────────────────────┤
│ Steward Brief hero  [LIGHT]                                   │
│   AgentBriefPanel(agent="steward", variant="light")           │
│   • brief lines: readiness posture, blockers, next move       │
│   • recommended action: "Seed PRG-02 contract evidence"       │
├───────────────────────────────────────────────────────────────┤
│ 5-zone control plane (Apple-like)                             │
│   A · Users & Access                                          │
│   B · Governance                                              │
│   C · Connectors & Data Sources                               │
│   D · Dataset Domain Readiness (ADM3 / ADM4)                  │
│   E · Object Inspector  (drawer-mounted)                      │
├───────────────────────────────────────────────────────────────┤
│ Agent Readiness Matrix (per-agent posture)                    │
└───────────────────────────────────────────────────────────────┘
```

---

## Steward Brief

- Renders via `AgentBriefPanel(agent="steward", variant="light")`.
- MUTED top border + MUTED footer badge.
- Brief lines summarize:
  - "Tenant readiness: 64% loaded · 41% usable as evidence."
  - "12 dataset domains · 2 blocked · 3 partial."
  - "1 connector pending Steward review."
- Recommended action: a single, executable verb — "Seed contract
  artifact for PRG-02 (G2)".
- Three follow-ups: `Why is PRG-02 blocked`, `What does loaded
  mean`, `Show me orphan datasets` — each disabled with the
  `deferred · live steward runtime` sub-label.

---

## 5-zone control plane (Apple-like)

Zones live as **vertical sections** on the page. Each zone has:

- mono uppercase eyebrow ("Zone A · Users & Access")
- short summary line
- a calm card cluster with row-level drilldown

### Zone A · Users & Access

- Lists users + roles. Hairline-soft row separators. No avatars.
- Each row carries a NAVY chip for role and an `EvidenceChip` for
  attestation state.
- Drilldown opens `DetailDrawerShell` on the right.

### Zone B · Governance

- Lists governance posture (data residency, retention, policy
  attestations).
- Renders `EvidenceChip` per policy: `cited` → policy referenced,
  `partial` → draft, `blocked` → policy missing.

### Zone C · Connectors & Data Sources

- Lists connectors (none live in v2 — Steward seeds only).
- Each row carries a `FileTypeChip` for the source format and an
  `EvidenceChip` for usability.
- No "Sync now" CTA. v2 is read-only.

### Zone D · Dataset Domain Readiness (ADM3 / ADM4)

- Mounts the existing ADM4 `DatasetExplorerPanel`.
- 12 canonical domain rollup cards in canonical ordinal order.
- Each card shows loaded / available / usable counts and a status
  chip (NAVY ready, AMBER partial, RED blocked, MUTED not_started).

### Zone E · Object Inspector

- Right-side `DetailDrawerShell` mounted from row clicks across
  Zones A-D.
- Eyebrow: `object inspector`.
- Body: full row schema rendered as a compact key-value list.
- Footer: source caption (e.g. `ADM3 deterministic seed`).
- When no row is selected, the slot renders an `EmptyInspector`
  with caption "Select a row to inspect. The inspector pulls
  deterministic ADM3 fields."

---

## Loaded / available / usable evidence model

Three counts, three meanings, in canonical order:

1. **Loaded** — the artifact / dataset has been brought into the
   tenant's storage. Existence-only. The lowest bar.
2. **Available** — the artifact is parseable and discoverable in
   the seeded inventory. Steward has confirmed shape.
3. **Usable as evidence** — the artifact has been quality-checked
   and bound to an `E-###` evidence id. The highest bar.

Invariant: `loaded ≥ available ≥ usable`. The visual canon
enforces this with three columns of monotonically smaller counts on
every Zone D rollup.

---

## Agent Readiness Matrix

A compact grid: agents (Nexus, Sentinel, Atlas, Steward) × dataset
domains. Each cell renders one of:

- `EvidenceChip(state="usable_as_evidence")` — agent can run.
- `EvidenceChip(state="partial")` — agent has partial input.
- `EvidenceChip(state="blocked")` — agent blocked on this domain.
- `EvidenceChip(state="not_seeded")` — Steward has not seeded yet.

The matrix is **honest** — empty cells are honest, not hidden.

---

## ADM4 dataset explorer integration

Zone D mounts the ADM4 `DatasetExplorerPanel` exactly as built —
this blueprint does not alter ADM4. The visual canon update is:

- The panel sits inside Zone D's vertical section.
- The section eyebrow reads `Zone D · Dataset Domain Readiness`.
- The panel's "Show all datasets" detail remains collapsed by
  default.

---

## Acceptance criteria

An Admin Setup surface is canon-compliant when:

1. `AbarvaTopNav` is rendered with `active="admin"`.
2. The brief uses `AgentBriefPanel(agent="steward", variant="light")`.
3. Five zones (A-E) are present and labeled with mono eyebrows.
4. Zone D mounts the existing ADM4 `DatasetExplorerPanel` (no
   re-implementation).
5. Zone E renders `DetailDrawerShell` on row selection and an
   `EmptyInspector` when nothing is selected.
6. The loaded ≥ available ≥ usable invariant is visibly enforced
   on every domain rollup.
7. Agent Readiness Matrix uses `EvidenceChip` per cell.
8. No live connector CTA, no "Sync now" button.
9. All colors flow from `abarva-theme.ts`.
10. Empty inspectors carry honest captions per canon §I.
