# Moves Scenario Quality Lab — 2026-05-19

## Purpose

This is the first deterministic quality lab for the full Intelligence → Moves
scenario path. It tests whether a complex idea can be shaped into CFO-readable
Moves artifacts, scored artifact-by-artifact, and challenged with updated
workshop content.

This is not a substitute for a watched human usability session. It is the
repeatable engineering harness that tells us what the product currently does
before we put it in front of a real CXO / VP Sourcing / delivery leader.

## Test Path

1. Start from a tenant-specific strategic idea.
2. Resolve the grounded Moves case anchor.
3. Generate Discover, Charter, Design & Plan, Financial Model, CFO Pack, and
   Mobilize outputs.
4. Simulate a working-session update packet.
5. Accept known baseline / assumption / rate-card / workshop inputs.
6. Reject unmapped content.
7. Score every artifact on a 10-point quality scale.
8. Move to the next tenant case using the same harness.

## Current Scores

| Tenant | Use case | Overall | Kernel recommendation | Next best action |
|---|---|---:|---|---|
| Apex Retail | Contact Center AI Routing | 8.2 / 10 | shape | Provide cost per contact or confirm owner |
| Meridian Health System | Ambient Clinical Value Chain Activation | 8.3 / 10 | shape | Provide cost per clinician hour or confirm owner |
| First Capital Financial | Fraud Detection Enhancement | 8.3 / 10 | shape | Provide false-positive operational cost or confirm owner |

## Increment 1 — Watched-Session Mode

The next increment adds a deterministic watched-session mode. A transcript-like
session object now carries participant roles and observed signals. The kernel
extracts proposed updates, routes them into baseline / assumption / rate-card /
workshop lanes, rejects unmapped content, and produces a regeneration diff that
names the affected artifacts before anything changes.

This is still a proxy watched session, not an external practitioner session.
The important improvement is the process capability: the product can now show
what would change, why, and which artifacts must regenerate.

| Tenant | Baseline score | Watched-session mode | Improvement |
|---|---:|---:|---:|
| Apex Retail | 8.2 / 10 | 8.4 / 10 | +0.2 |
| Meridian Health System | 8.2 / 10 | 8.4 / 10 | +0.2 |
| First Capital Financial | 8.2 / 10 | 8.4 / 10 | +0.2 |

Watched-session mode lifts the two weakest areas:

- Intelligence idea and bet framing improves because the case now receives
  observed session signals rather than only a static update packet.
- Workshop and advisory support improves because the session produces a
  regeneration diff, not just a list of accepted inputs.

The remaining gap is explicit: replace the proxy transcript with a real
practitioner-observed session.

## Increment 2 — Regeneration Preview

The second increment takes the watched-session output one step further. Accepted
updates are no longer only marked as `requires_regeneration`; they are
preview-applied into a deterministic case preview:

- baseline updates resolve seed gaps in the preview and recompute baseline
  coverage;
- assumption challenges lower confidence and carry the required reviewer action;
- rate-card overrides are accepted but explicitly require a full effort-estimator
  recompute;
- workshop decisions become Mobilize actions;
- unmapped content remains rejected.

This is still not a silent case mutation. It is a controlled before / after
preview for the reviewer.

| Tenant | Static/update-packet mode | Watched + preview mode | Improvement |
|---|---:|---:|---:|
| Apex Retail | 8.2 / 10 | 8.5 / 10 | +0.3 |
| Meridian Health System | 8.2 / 10 | 8.5 / 10 | +0.3 |
| First Capital Financial | 8.2 / 10 | 8.5 / 10 | +0.3 |

The score moves because the two process gaps are now partly closed: workshop
signals are routed into a visible preview, and the updated-content loop can show
which artifacts would change before promotion. The remaining gap is the same
honest one: the transcript is still proxy-authored, not external-practitioner
observed.

## Increment 3 — Reviewer Sign-Off Gate

The third increment adds a deterministic sign-off gate over the regeneration
preview. The preview cannot promote itself. The lab now creates a reviewer
packet with three lenses:

- CFO / Finance signs off that financial changes must flow through the full
  estimator before promotion;
- Delivery Lead signs off that workshop actions and challenged assumptions are
  suitable for regeneration, not final approval;
- Domain Operator signs off that updated baseline facts are stated evidence
  requiring verification before the gate.

The state after sign-off is `ready_for_full_recompute`, not `approved`. This is
the important control: the case can move to recomputation, but it still cannot
claim final economics until the affected artifacts regenerate.

| Tenant | Watched + preview | Watched + preview + sign-off | Promotion state |
|---|---:|---:|---|
| Apex Retail | 8.5 / 10 | 8.5 / 10 | ready for full recompute |
| Meridian Health System | 8.5 / 10 | 8.5 / 10 | ready for full recompute |
| First Capital Financial | 8.5 / 10 | 8.5 / 10 | ready for full recompute |

This increment does not inflate the headline score; it closes the governance
gap underneath it. The next score lift requires a real practitioner-observed
session or the full recompute engine.

## Artifact Scorecard

| Artifact / process area | Apex | Meridian | First Capital | Read |
|---|---:|---:|---:|---|
| Intelligence idea and bet framing | 8.2 | 8.2 | 8.2 | Proxy watched-session signals improve framing; external live-dialogue testing remains open. |
| Discover brief | 8.5 | 8.8 | 8.7 | Strong baseline honesty; seed gaps explicit. |
| Charter business-case skeleton | 8.5 | 8.5 | 8.5 | Strong value / effort / assumptions / kill logic. |
| Costed business-case pack | 8.2 | 8.2 | 8.2 | Good CFO structure; critique and flags visible. |
| Financial model | 8.5 | 8.5 | 8.5 | Strong range / rate-card / payback honesty. |
| CFO business-case pack | 8.3 | 8.3 | 8.3 | Good executive actionability; blockers not buried. |
| Mobilize and go-decision packet | 8.3 | 8.3 | 8.3 | Good Tower handoff and no-go discipline. |
| Workshop and advisory support | 8.6 | 8.6 | 8.6 | Session updates route into preview-applied changes; real human facilitation still unproven. |
| Updated-content acceptance loop | 9.3 | 9.3 | 9.3 | Known inputs accepted, preview-applied, and unmapped inputs rejected. |
| Trace, governance and auditability | 8.3 | 8.3 | 8.3 | Strong review gate, assumptions, critic, and export catalog. |

## Updated Content Test

The lab sends each tenant a realistic working-session update packet:

- baseline metric updates,
- assumption challenges,
- rate-card / budget overrides where relevant,
- workshop notes with required actions,
- one intentionally unmapped input.

The expected behavior is strict:

- known baseline keys are accepted and marked for regeneration,
- known assumption keys are accepted as expert-review challenges,
- rate-card overrides are accepted as estimate-impacting inputs,
- workshop notes must include an action or decision,
- unmapped content is rejected and never silently changes the business case.

Watched-session mode adds a regeneration diff:

- recommendation before,
- recommendation after state (`requires_regeneration`),
- accepted changes with before / after values where known,
- rejected changes with reasons,
- affected artifacts such as Discover brief, business case pack, financial
  model, CFO pack, and Mobilize packet.

Regeneration preview then applies the accepted changes to a preview copy of the
case, never to the promoted case:

- baseline coverage before / after,
- seed gaps resolved in preview,
- assumptions challenged,
- rate-card overrides requiring estimator recompute,
- Mobilize actions added,
- blocked changes and rejected changes kept visible.

Reviewer sign-off adds the promotion control:

- approved change keys,
- unapproved change keys,
- required actions from each reviewer lens,
- roles covered,
- promotion state (`ready_for_full_recompute` or `blocked`).

## What This Proves

The Moves kernel is now meaningfully expert-grade for deterministic artifacts:

- it produces costed, time-phased, risk-adjusted cases;
- it refuses to fabricate payback when monetization is blocked;
- it gives next-best questions;
- it handles updated content as controlled inputs, not loose prose;
- it can run the same quality harness across all three client anchors.

## What It Does Not Yet Prove

The remaining gap is not artifact generation. It is live professional behavior:

- a real CXO / VP Sourcing has not yet driven the Intelligence dialogue;
- a real workshop has not yet produced the update packet;
- we have not measured whether a practitioner can understand and trust the
  output under time pressure;
- Intelligence → Moves promotion is still scored as structurally good, not
  human-validated.

## Next Fix

The next product increment should replace the proxy transcript with a real
observed practitioner session and then run the full recompute:

1. Capture the live prompt / workshop transcript from a real CXO / VP Sourcing
   / delivery leader.
2. Convert observations into proposed baseline, assumption, rate-card, and
   action updates.
3. Show the diff and deterministic preview.
4. Let the reviewer accept / reject each update through the sign-off gate.
5. Run the full recompute for affected artifacts.
6. Record the before / after score and audit trail.

That is the step from "excellent deterministic artifacts" to "expert consultant
in the room."
