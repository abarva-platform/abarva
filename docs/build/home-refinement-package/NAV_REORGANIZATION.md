# Nav Reorganization · Top Nav Before/After

**Outcome:** Top nav renders 5 items left-to-right: Home · Intelligence · Moves · Source · Tower.

---

## Before (current state · approximate)

The top nav today likely has some combination of:

- AbarVa logo / brand mark (left)
- Home (or Dashboard, or nothing)
- Setup
- Intelligence
- Strategic Moves (or Moves)
- Source
- Tower
- Maestro / Other admin items
- User menu / avatar (right)

Exact state to be confirmed by Phase 0 baseline of Journey Kit. Possibilities:

- 7+ items including admin-only entries
- Setup as a top-level item (this package eliminates it)
- Some surfaces named differently ("Programs" vs "Strategic Moves")

---

## After (this package)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [AbarVa]   Home · Intelligence · Moves · Source · Tower    [user] │
└─────────────────────────────────────────────────────────────────────┘
```

5 items. Strict order: Home · Intelligence · Moves · Source · Tower. Left-to-right.

---

## Per-item specification

### Home (URL: `/`)

**Job:** Tenant orientation, configuration, substrate visibility, product info / training. The operational control plane.

**Replaces:** Whatever currently shows at `/` (probably either nothing or an old dashboard) AND `/setup` content.

**Active state:** When user is on `/` or any `/home/*` panel, Home nav item is active.

### Intelligence (URL: `/intelligence`)

**Job:** Synthesize signals across substrate. Knowledge & context layer. Art of the possible. Move candidate identification. Sentinel chat.

**No change** — current Intelligence surface preserved. Just reordered in nav.

**Active state:** When user is on `/intelligence` or any `/intelligence/*` sub-route.

### Moves (URL: `/strategic-moves`)

**Job:** Execute Strategic Moves through 6 phases (P0 Originate → P5 Mobilize & Handoff). Originate, Charter, Discover, Design, Roadmap, Mobilize. Move detail pages, deliverables, gate criteria.

**Label:** "Moves" (short form). Tooltip / hover may show "Strategic Moves" for full name.

**No URL change** — internally stays `/strategic-moves` for compatibility with existing links and search rankings. Just the nav label is short.

**Active state:** When user is on `/strategic-moves` or any `/strategic-moves/*` sub-route.

### Source (URL: `/source`)

**Job:** Vendor / sourcing / commercial intelligence. Vendor health monitoring, contract intelligence, market signals, sourcing decisions for Strategic Moves.

**No change** — current Source surface preserved.

**Active state:** When user is on `/source` or any `/source/*` sub-route.

### Tower (URL: `/tower`)

**Job:** Portfolio-level monitoring across all AI bets. Cross-Move pressure tracking, value-at-risk, decision queues, Atlas synthesis. Per the AI Control Tower framework — but not platform-canonical, just one of multiple persona views (CFO, CIO, CSO, CEO).

**No change** — current Tower surface preserved.

**Active state:** When user is on `/tower` or any `/tower/*` sub-route.

---

## What's removed

If any of the following currently exist as top-nav items, they get removed (not deleted; just removed from nav):

- **Setup** — folded into Home; deprecated as nav item
- **Maestro** — if currently visible, demoted to internal admin route at `/admin/maestro` (or similar); not in top nav
- **Dashboard** — replaced by Home if existed
- **Programs** — synonym for Moves; not a separate nav item
- **Reports** — if exists as separate nav item, folded into appropriate surface (probably Tower); not separate
- **Profile / Account / User Settings** — accessible via user menu (avatar on right), not top-nav item

For each removed item: route stays accessible (no URL deletion in this PR), just not visible in top nav.

---

## Acceptance criteria for top nav

```
✓ Top nav renders exactly 5 items
✓ Items in this order: Home · Intelligence · Moves · Source · Tower
✓ Home is leftmost; Tower is rightmost
✓ User menu / avatar still accessible (typically right of nav)
✓ Active state highlights correctly per current page
✓ Mobile / responsive: nav collapses correctly without losing 5-item structure
✓ Keyboard navigation: tab order is Home → Intelligence → Moves → Source → Tower
✓ Visual treatment: consistent typography, spacing, hover state per existing design system
```

---

## What this nav signals

The 5-item nav tells a story:

1. **Home** — orient yourself, configure the platform, learn the product
2. **Intelligence** — understand what's happening
3. **Moves** — do something about it
4. **Source** — for things that need vendor / commercial action
5. **Tower** — monitor the whole portfolio over time

This is the natural left-to-right read of "what does AbarVa do?" Each item has a distinct job. No item duplicates another.

The order is also temporal-ish:
- New users start with Home
- Then Intelligence (understand)
- Then Moves (act)
- Then Source / Tower (extend / monitor)

This sequencing reinforces the journey doctrine: Setup → Intelligence → Moves is the canonical path, with Source and Tower as periodic returns.

---

## Browser-Chrome verification

```
Step 1 — Navigate to / (post-rename)
  ✓ Top nav renders 5 items in order
  ✓ Home active state visible
  ✓ Screenshot

Step 2 — Click Intelligence
  ✓ Top nav still 5 items
  ✓ Intelligence active state
  ✓ Home no longer active
  ✓ Screenshot

Step 3 — Click Moves
  ✓ Goes to /strategic-moves (URL preserved)
  ✓ Moves nav item active
  ✓ Screenshot

Step 4 — Click Source
  ✓ Source page renders
  ✓ Source nav item active
  ✓ Screenshot

Step 5 — Click Tower
  ✓ Tower page renders
  ✓ Tower nav item active
  ✓ Screenshot

Step 6 — Verify old /setup redirects
  ✓ /setup → 301 → /
  ✓ /setup/data-trust → 301 → /home/data-trust (or wherever per route plan)
  ✓ Screenshot of redirect chain
```

6 screenshots minimum. All saved to `/docs/build/home-refinement-run-2026-05-07/screenshots/nav/`.
