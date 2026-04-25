# Programs Page · Visual Blueprint (DES1)

Status: Canonical (DES1)
Authored: 2026-04-25

The Programs surface is the **portfolio canvas** for AbarVa: where
operators read program-by-program state, where Nexus runs the
mastermind layer, and where Steward signs phase gates. The
Programs page must read like a private-banking statement — calm,
deliberate, and trustable.

This blueprint binds the AbarVa Visual Canon
([../ABARVA_VISUAL_CANON.md](../ABARVA_VISUAL_CANON.md)) to the
Programs read-models defined by S8 / S9 / PDEL / PF1.

---

## Page structure

```
┌───────────────────────────────────────────────────────────────┐
│ AbarVaTopNav (52–56px, light)                                 │
├───────────────────────────────────────────────────────────────┤
│ Page eyebrow ("Programs portfolio")                           │
│ AgentBriefPanel (variant=light, agent=nexus)                  │
│   • brief lines: portfolio posture, gate status across G1–G4   │
│   • recommended action: "Drive G2 close on PRG-02 today"      │
│   • follow-ups: 3 disabled "Ask Nexus" chips                  │
├───────────────────────────────────────────────────────────────┤
│ MetricStrip (≤ 5 metrics, NAVY tone for healthy)              │
│   programs · in_motion · gates_signed · evidence_usable · …   │
├───────────────────────────────────────────────────────────────┤
│ Portfolio table                                               │
│   columns: code · name · phase · gate · evidence · steward    │
│   row click → /tenant/[slug]/programs/[code]                  │
├───────────────────────────────────────────────────────────────┤
│ Per-program canvas (when row drilled in)                      │
│   ┌──────────────────────────────────────────────────────┐    │
│   │ JourneyRail (six phases · G1–G4 caps · honest end)   │    │
│   ├──────────────────────────────────────────────────────┤    │
│   │ Phase canvas: deliverables, evidence chips, owner    │    │
│   │ DetailDrawerShell for any artifact / E-id            │    │
│   └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

---

## Six-phase journey

Phases (canonical):

| # | Phase | Owner |
| -- | --- | --- |
| 1 | Origination | Maestro + Nexus |
| 2 | Plan | Maestro |
| 3 | Build | Engineering |
| 4 | Pilot | Maestro + Steward |
| 5 | Execute | Operations |
| 6 | Verify | Steward |

Gates (canonical) live **between** phases:

| Gate | Between | Role |
| --- | --- | --- |
| G1 | Origination → Plan | scope sign-off |
| G2 | Plan → Build | architecture + budget sign-off |
| G3 | Build → Pilot | readiness sign-off |
| G4 | Pilot → Execute | rollout sign-off |

There is **no G5** after Execute. The `JourneyRail` primitive renders
the rail honestly: 6 phase chips and exactly 4 gate caps. Verify is
the closing phase, not a fifth gate.

Gate status partition (canonical):

- `signed` → NAVY, glyph `✓`
- `missing_inputs` → AMBER, glyph `!`
- `not_wired` → MUTED, glyph `·`

---

## Nexus mastermind role

Nexus is the **mastermind agent** on this surface. Nexus owns:

- The portfolio brief at the top of the page.
- The "what should I do today" recommended action.
- The cross-program orchestration (e.g. "P-02 G2 needs the same
  contract Steward already signed on P-04").

Nexus never appears as an avatar, never as a chat bubble. Nexus is
visible only as:

- The `AgentBriefPanel` accent (NAVY top border + footer
  `AgentBadge`).
- An optional NAVY chip on a row that reads "Nexus suggests…".

---

## Steward gate role

Steward signs gates. On this surface, Steward is visible only when:

- A gate is `missing_inputs` and Steward is the named blocker.
- A row carries a "Steward review" chip in MUTED accent.

Steward never narrates. The agent's contribution is the signature.

---

## Deliverables and artifacts (PDEL)

Per-program canvas surfaces deliverables and artifacts via the PDEL
read-model. Rules:

- Each deliverable row carries: `FileTypeChip` (DOC / PDF / XLS /
  PPT / NOTE / HTML / DATA), title, owner, and an `EvidenceChip`
  for its lifecycle state (`not_seeded` → `partial` → `cited` →
  `quality_checked` → `usable_as_evidence`, with `blocked` as the
  red exit lane).
- Clicking a deliverable opens a `DetailDrawerShell` with the
  artifact body. The page does **not** navigate away.
- Drawer width: 400px (clamped 360–480 by the primitive).
- The drawer footer source-label names the deterministic source
  ("PDEL deterministic seed", never "live model").

---

## Hide / show rules

- The `AgentBriefPanel` follow-up chips are **always disabled** with
  the `deferred · live nexus runtime` sub-label until the live
  Nexus runtime ships.
- The `MetricStrip` hides metrics whose value is `null` rather than
  rendering `—`. If fewer than 3 metrics are non-null, fall back
  to the brief alone.
- Empty per-program canvas renders an `EmptyInspector` with caption
  "No deliverables seeded for this phase. Steward seeds via Setup."
- A `not_wired` gate cap on the rail is honest — do not soften it.

---

## Acceptance criteria

A Programs surface is canon-compliant when:

1. The page renders `AbarvaTopNav` with `active="programs"`.
2. The brief uses `AgentBriefPanel(agent="nexus", variant="light")`.
3. The metric strip never exceeds 5 entries.
4. The portfolio table uses hairline-soft row separators and no
   zebra striping (canon §J).
5. Per-program canvas renders `JourneyRail` with 6 phases and
   exactly 4 gates (no fake G5).
6. Deliverables list uses `FileTypeChip` + `EvidenceChip` and opens
   `DetailDrawerShell` — never a modal, never a new page.
7. No agent avatar, no chat bubble, no spark-line wall.
8. All colors flow from `abarva-theme.ts`.
9. The `not_wired` gate state is rendered honestly with the muted
   glyph (`·`), not hidden.
10. Any empty inspector names *why* it is empty per canon §I.
