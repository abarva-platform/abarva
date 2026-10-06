# Moves Approval and Phase Lifecycle Contract

## Authority

The authenticated workspace user with the required Moves capability is the only
person who records product approvals. The approval is an explicit action in
Nexus, attributed to that user's identity and rationale.

A sponsor is a listed contact. Sponsor identity does not grant product access,
approval authority, or a vote in a Moves gate. A sponsor may receive
informational phase-progress email only when an authorized workspace user has
explicitly enabled that contact's notification preference. Progress email is
not an approval request and has no workflow effect.

## Workflow

1. Evidence, decisions, and generated deliverables are assembled for the active
   Move and phase. Generated or edited deliverables remain drafts until reviewed.
2. The server evaluates the current gate from governed state. A hard blocker
   prevents approval; clients cannot mark a gate ready by changing presentation
   state.
3. When ready, the Moves UI presents an approval action only to a workspace
   user with `canApproveGates` for that Move. The action requires explicit
   confirmation and a substantive human rationale.
4. `POST /api/v1/programs/:programId/advance` rechecks tenant scope, per-Move
   access, approval capability, rationale, and gate readiness on the server.
   Only then does it record the phase decision, actor, evidence packet, and
   phase transition.
5. Progress notifications are sent only to sponsor contacts whose preference
   is explicitly enabled. Notification failure does not change the approval.

Deliverable sign-off follows the same authority rule. The sign-off route checks
the workspace user's permission and the deliverable's current version. Its
client-readiness scan remains mandatory; acknowledging readiness blockers is a
separate, deliberate action and is never implied by approval.

## Agent and chat boundary

aVa may explain readiness, identify blockers, prepare drafts, and recommend the
next step. It cannot approve a deliverable, satisfy a gate, create a sponsor
approval request, or advance a phase based on natural-language intent or a
model-generated control block. Chat tools return the gate state and direct the
authorized workspace user to the explicit in-product approval action.

The legacy `POST /api/engage/:engagementId/turn` conversation route resolves the
graph id inside the active tenant and then checks per-Move read access before
loading conversation context. A listed sponsor contact alone cannot access the
route. Chat may update phase-one working drafts, but it cannot sign them off or
change the phase.

## Retired paths and compatibility

- Sponsor approval and workflow-commitment writes return `410 Gone` with the
  workspace-user approval model.
- Historical sponsor-approval records may remain readable for audit and
  migration purposes, but they do not satisfy current gate criteria.
- The filesystem sponsor-commitment ledger and model-driven gate lifecycle are
  not runtime authorities.
- `founder_approval_required` is legacy state only; it does not create an
  external sponsor approval path.

## Required proof

Tests must prove both sides of the authority boundary: an authorized workspace
user can record a ready gate and an unauthorized or sponsor-only identity
cannot. They must also prove that a hard gate blocker remains blocking, chat
cannot write approval state, sponsor notification is opt-in and informational,
and tenant-scoped graph-id reads cannot return another client's engagement.

The release record and live acceptance evidence remain separate from unit
tests. A merge or healthy deployment alone is not proof of signed-in approval,
audit attribution, notification behavior, or phase readback.
