# Page · Source

Status: Canonical (CAT1)
Authored: 2026-04-25

## Page purpose

Source is AbarVa's **sponsor signal feed** — the surface where
sponsor-side conversations, emails, and uploads flow into the
platform and become structured Source events. Source's job is to
take raw sponsor signal and either route it to a program (Nexus
context bundle update), surface it as a pattern (Sentinel
detection), or escalate it for Steward review. The page reads
calm: a chronological feed of events with deterministic
attribution, never a chat-style timeline.

## Primary user question

"What are sponsors saying, and what should I act on?"

## Primary agent

Nexus (with Sentinel detection on the feed; Steward owns review /
approval handoffs).

## Route(s)

- `/(maestro)/source` — Source landing surface.
- `/(maestro)/source/events` — Source events feed (canonical
  primary route).

## Required data contract / read model

- Source Context Bundle contracts (S1 / S2 — context bundle and
  context scoring/classifier).
- Source agent-context module (`src/lib/source/agent-context.ts`).
- Source context-quality module (`src/lib/source/context-quality.ts`).
- Sentinel detection layer (I1) for pattern detections over Source
  signals — **to be defined** as a Source-specific extension.

## What the page knows

- Per-event metadata: source channel (email / upload / sponsor
  portal), arrival timestamp, declared sponsor, declared subject.
- Context-quality classification (high / medium / low / unknown).
- Inferred program / phase association where available.
- Deterministic attribution: which sponsor account, which engagement,
  which program (if linked).
- Whether the event has been routed (to Nexus context bundle), is
  pending Steward review, or is blocked.

## What the page is missing

- Live email / SMS / Slack ingestion — connector implementations
  are deferred.
- Live model-composed summarization of long Source artifacts —
  v2 surfaces deterministic excerpts only.
- Cross-tenant Source rollups — Source is per-tenant in v2.
- Two-way sponsor reply from inside AbarVa — replies are out of
  scope.

## Key user actions

- Scroll the chronological event feed; read the deterministic
  excerpt for each event.
- Click an event → drill into the Source event detail (`/source/events/[eventId]`)
  for full artifact, review state, and approval flow.
- Filter by sponsor / program / channel / context-quality state.
- Route an event manually (Steward override) when auto-routing is
  unavailable.

## Agent actions

- **Nexus** composes the per-event context-quality classification,
  infers program / phase association, updates the program's
  Context Bundle when the event resolves to a known program.
- **Sentinel** runs pattern detection over the rolling Source
  feed; surfaces detected patterns as cross-link chips on events.
- **Steward** reviews events flagged as low-quality or
  high-sensitivity; signs review when artifact moves to "available"
  state.
- **Atlas** does not author here; reads the Source posture for the
  Tower brief.

## Empty / degraded states

- No events in feed → render `EmptyInspector` with caption
  "No Source events seeded. Steward seeds Source events via
  connector configuration in Setup."
- Event with low-context classification → render with AMBER chip
  and inline note "Context quality: low — Steward review
  recommended."
- Event blocked → render with RED chip and inline reason.
- Connector unavailable → footer caption "Source connector
  pending Steward configuration; events shown are Steward-seeded."

## Navigation / drill-down behavior

- Top nav `active="source"`.
- Event row click → navigates to `/source/events/[eventId]` (full
  artifact / review / approval surface — see page 06).
- Sentinel pattern chip click → opens Intelligence with the
  detected pattern preselected.
- Program inference link → opens Programs with the inferred program
  preselected.
- No modals; detail views are full pages or right-side drawers.

## MVP / V1 / V2 scope

- **MVP (deferred to V1)** — Source is V1 priority, not MVP. The
  MVP catalog references it but the slice ships after Programs +
  Intelligence + Tower + Setup.
- **V1** — chronological event feed, deterministic attribution,
  context-quality classification, manual Steward routing.
- **V2** — live multi-channel ingestion (email / SMS / Slack /
  sponsor portal), model-composed summarization, two-way reply.

## Visual blueprint reference

- No dedicated blueprint exists yet under `docs/design-canon/archive/pre-canon-design/pages/` for
  Source. Until one is authored, Source inherits the Programs
  visual blueprint chrome (top nav, light surface, calm feed) and
  the Intelligence pattern-card chrome for Sentinel detection
  cross-links.
- Visual canon: [`docs/design-canon/archive/pre-canon-design/ABARVA_VISUAL_CANON.md`](../../design-canon/archive/pre-canon-design/ABARVA_VISUAL_CANON.md).
