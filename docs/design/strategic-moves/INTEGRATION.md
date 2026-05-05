# Integration guide — Strategic Moves home

Read this **after** the README. This file tells you what to touch, what to leave alone, and where this surface fits inside the AbarVa app.

## Where this lives

- **Route.** `/app/strategic-moves` (dashboard) · `/app/strategic-moves/:moveId` (workspace) · `/app/strategic-moves/new` (originate / P0).
- **Nav.** Authenticated app navbar, sits between **Programs** and **Control Tower**.
- **Auth.** Maestro role required. Sponsor and observer roles see read-only.
- **Module folder (suggested).** `app/modules/strategic-moves/` with subfolders `dashboard/`, `workspace/`, `originate/`, `shared/`.

> **Navigation pivot (v0.2).** The Detail page evolves into the **Move Workspace** — a phase-navigable surface where clicking any phase node in the rail shows that phase's gate criteria, deliverables, and context in past/current/future state. The binding reference spec is `15-workspace-v0.2.html`. The Originate flow (P0) is now also rendered inside the Workspace shell (View D) rather than as a standalone page. Implementation pending.

## What to touch

- Add the three views as routes/pages in the existing app router.
- Reuse existing canon components wherever possible (see README's "Component identification" table).
- Extract the **phase rail** (`.detail-rail`) into a single shared component — it's used in both detail and originate, and will be used by future surfaces (Charter, Decision, Run, etc.). Suggested API:

  ```tsx
  <PhaseRail current={3} totalPhases={8} />
  // renders P0…P7 dots with the current phase highlighted
  ```

- Wire the originate flow's "start from" chips to real data:

  | Chip | Existing module to query |
  |---|---|
  | An Intelligence finding | `Intelligence` module — `GET /api/intelligence/findings?tenant=:t` |
  | A Foundation Readiness gap | `Foundation` module — `GET /api/foundation/gaps?tenant=:t` |
  | A pre-mortem result | `Pre-mortem` module — `GET /api/premortems?tenant=:t&status=run` |
  | Cross-industry transfer | `Transfer library` — `GET /api/transfers?seedFor=:tenant` |
  | A blank hypothesis | No data — opens free-form chat with Nexus |

- Persist `listView` and `sort` as user preferences (`PUT /api/users/me/preferences`), not via the prototype's edit-mode protocol.

- The **Promote to P1 Charter** action should:
  1. `POST /api/strategic-moves` with the 7-section payload + originating evidence reference.
  2. On success, navigate to `/app/strategic-moves/:newMoveId`.
  3. On failure, surface an inline error in the scaffold footer — not a toast.

## What to leave alone

These are intentional and load-bearing — don't refactor them away on a first pass:

- **The two-pane shell** (`.ws-shell` / `.detail-shell` = chat-left + canvas-right). It's the canon shape for any agent-mediated work surface. The Move Workspace (v0.2) and Originate share it on purpose; future surfaces (Charter, Decision, Run) will too.
- **The 7-section P0 scaffold structure.** The order and the keys (`hypothesis` → `archetype` → `sponsor` → `tenant` → `foundation` → `value` → `evidence`) match the canon P0 charter template. Don't reorder; don't merge.
- **The fill-in animation timing** (~380ms stagger, `cubic-bezier(0.2, 0.7, 0.2, 1)`). It's there to make Nexus feel like it's *drafting*, not just dumping. Don't shorten.
- **Status colors are semantic.** A red chip means a real gate-blocked condition. Never apply red/amber/teal as decoration.
- **The "+ New Move" button is black, not blue.** The signal-blue CTA is reserved for Public surfaces and one-per-page accents — not in-app primary actions.
- **No gradients, no SVG icon sets, no emoji.** Canon rule. The only icon glyphs are: status dots, the V monogram (FAB), and text arrows `→`.

## Don't ship the tweaks panel

The `<div id="tweaks-panel">` and its associated CSS/JS in the prototype are a designer affordance for toggling `listView` and `sort` while exploring. Strip it on integration. The values map to user preferences.

## Token mapping — note on `--gold`

The prototype uses `--gold: #9C7B3F` for mono eyebrow labels inside the Nexus dark panel and the originate-view's filled-state labels. **This token is not in `tokens.css` and should not be added.** Replace with:

| Where `--gold` is used | Use this instead |
|---|---|
| Mono eyebrow labels on the dark Nexus panel | `--abarva-signal-blue` (already canon for eyebrows on dark) |
| Filled-state labels in `.scaffold-row.filled .label` | `--abarva-signal-blue` |
| Start-from label in originate left pane | `--abarva-signal-blue` |

## Data contracts (suggested)

```ts
type Move = {
  id: string;                          // e.g. "APX-CDP-2026"
  name: string;
  tenant: { id: string; name: string };
  archetype:
    | 'PLATFORM MODERNIZATION'
    | 'CUSTOMER-SIDE GROWTH'
    | 'COST EFFICIENCY'
    | 'RISK / COMPLIANCE'
    | 'CAPABILITY';
  phase: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  phaseLabel: string;                  // "P3 Solution Design"
  valueAtStakeMUSD: number;            // canonical value at stake in $M
  status: 'on-track' | 'awaiting-decision' | 'gate-blocked' | 'validated';
  statusText: string;                  // human label e.g. "GATE BLOCKED"
  statusDesc: string;                  // sub-line e.g. "P3 → P4 Build · 2 / 5 criteria met"
  sponsor: { name: string; role: string };
  updatedAt: string;                   // ISO
};

type P0Charter = {
  hypothesis:  string;
  archetype:   string;
  sponsor:     string;
  tenant:      string;
  foundation:  string;
  value:       string;
  evidence:    string;
  originatingEvidence?: { kind: 'intel' | 'foundation' | 'premortem' | 'transfer'; refId: string };
};
```

## Test cases worth pinning

1. Open dashboard → all 7 sample moves render in scatter view by default.
2. Toggle to kanban → 8 columns P0–P7, moves grouped by phase.
3. Click a move → detail view loads with phase rail showing the move's current phase.
4. Click "+ New Move" → originate view loads, scaffold all empty, all 5 start-from chips active, Promote disabled.
5. Click "An Intelligence finding" chip → 4 of 7 sections fill in over ~1.5s, helper text reads "4 of 7 sections complete", Promote still disabled.
6. Type free-form text and send → next empty section fills with that text.
7. Fill all 7 sections → Promote button enables, helper text reads "Ready to promote".
8. Cancel with content → confirm dialog appears with three options.
9. Esc key with dialog open → dialog closes, returns to originate view.
10. Esc key with no dialog → triggers cancel flow.
11. Refresh on detail page → URL state restores the correct move.

## Out of scope for this handoff

- The floating **Ask Nexus FAB** behavior (it's documented as persistent across views; the FAB itself is owned by a separate canon component).
- The Nexus chat thread persistence and websocket layer.
- The Move detail body sections beyond the phase rail and head — those are stubbed in the prototype and are owned by a separate "Charter" handoff.
- Permissioning (sponsor / observer read-only treatment).
- Real authentication / tenant-switching.
