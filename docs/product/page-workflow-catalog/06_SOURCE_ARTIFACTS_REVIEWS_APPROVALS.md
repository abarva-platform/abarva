# Page · Source · Artifacts, Reviews, Approvals

Status: Canonical (CAT1)
Authored: 2026-04-25

## Page purpose

The Source artifact / review / approval surface is the
**per-event detail page** for a single Source event. It is where the
operator (typically Steward, sometimes Maestro) inspects the full
artifact, confirms its review state, and either approves it (moves
to `usable_as_evidence`), defers it, or blocks it. The page must
render like a paper memo: artifact body in the center, review state
on the right, approval action at the bottom — never like a chat
thread.

## Primary user question

"Which artifacts are still missing review, and who blocks them?"

## Primary agent

Steward (with Nexus surfacing program-context and Sentinel surfacing
detected patterns over the artifact body).

## Route(s)

- `/(maestro)/source/events/[eventId]` — canonical per-event detail.
- `/sponsor/[engagementId]` — sponsor-side mirror of the same event
  artifact (read-only for sponsors).

## Required data contract / read model

- Source Context Bundle contracts (S1 / S2).
- A Source review / approval read model — **to be defined** as part
  of the V1 Source roadmap. The contract must enumerate review
  states (`pending` / `in_review` / `approved` / `blocked`),
  approver identity, approval evidence id, and the linked program /
  phase.
- PDEL · Program Deliverables / Artifacts Read Model (when the
  artifact is bound to a program deliverable).

## What the page knows

- Full artifact body (deterministic excerpt; full body when v1
  artifact ingestion lands).
- Source channel + sponsor identity + engagement id.
- Inferred program / phase association.
- Current review state (pending / in_review / approved / blocked).
- Named reviewer + named approver (when assigned).
- Linked deliverable (when artifact is bound to a program).
- Detected patterns from Sentinel (cross-link chips).

## What the page is missing

- Live full-text artifact rendering for non-text formats (audio
  transcription, video, images) — deferred to V2.
- Live multi-step approval flow with signatures — v1 surfaces a
  single Steward approval action.
- Cross-tenant approver delegation — out of scope.
- Two-way artifact annotation (Maestro and Steward simultaneously)
  — out of scope for v1.

## Key user actions

- Read the artifact body in the center canvas.
- Inspect the review state in the right rail.
- Approve / defer / block the artifact (Steward action).
- Bind the artifact to a program deliverable (Nexus suggestion;
  Steward confirmation).
- Open the linked program / phase from the cross-link chip.

## Agent actions

- **Steward** signs the review, owns the approval action, drives
  the artifact to `usable_as_evidence` state.
- **Nexus** suggests the program / phase / deliverable to bind the
  artifact to (deterministic match against open program state).
- **Sentinel** surfaces patterns detected over the artifact body;
  patterns appear as cross-link chips on the artifact header.
- **Atlas** does not author here.

## Empty / degraded states

- Artifact body unavailable (binary blob with no parser) →
  render `EmptyInspector` with caption "Artifact body unavailable.
  Connector parser pending Steward configuration."
- Artifact unbound to any program → render the binding rail with
  `EmptyInspector` caption "No program binding suggested. Nexus
  could not match the artifact to an open program."
- Review state blocked → render RED chip + inline reason.
- Approver not assigned → render MUTED chip "Approver pending —
  Steward assigns via Setup."

## Navigation / drill-down behavior

- Top nav `active="source"`.
- Center canvas renders the artifact body. Right rail renders the
  review / approval state.
- Approval action button is the single primary CTA at the page
  footer; secondary actions (defer / block / bind) appear as muted
  text-links.
- Pattern chip click → Intelligence with the pattern preselected.
- Program binding link → Programs with the program preselected.
- No modals; the page IS the detail view.

## MVP / V1 / V2 scope

- **MVP (deferred to V1)** — this surface ships in V1 alongside
  the Source page.
- **V1** — artifact body, review state, single-step Steward
  approval, program binding suggestion, pattern cross-links.
- **V2** — live full-text rendering for non-text formats,
  multi-step approval, multi-approver delegation, live concurrent
  annotation.

## Visual blueprint reference

- No dedicated blueprint under `docs/design/pages/`. Inherits the
  Programs page chrome for top nav and side rails; uses the
  drawer-style review chrome from
  [`docs/design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md`](../../design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md)
  Zone E (Object Inspector) as reference for the right-side review
  rail.
- Visual canon: [`docs/design/ABARVA_VISUAL_CANON.md`](../../design/ABARVA_VISUAL_CANON.md).
