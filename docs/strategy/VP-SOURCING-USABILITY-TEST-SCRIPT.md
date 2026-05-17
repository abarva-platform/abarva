# VP Sourcing Usability Test Script

**Date:** 2026-05-17
**Purpose:** A concrete, watch-and-observe usability test of the Source practitioner-fit slice (Decision Queue + Renewal Cockpit) with a real IT sourcing VP. Pairs with `PRACTITIONER-FIT-DESIGN.md`.
**Format:** moderated, think-aloud, ~45 minutes. The participant talks through what they see and expect; the moderator does not lead.

---

## Setup

- Participant: a sitting (or recent) VP / Director of IT Sourcing or Procurement — not a friendly, ideally a skeptic.
- Environment: the live slice, signed in as a canonical demo CXO on one tenant (Apex Retail recommended — its `vendor_contracts` are seeded).
- Moderator rule: **ask "what would you expect / do here?" — never explain the product.** If they're stuck, that is the finding.
- Record screen + audio (with consent). Capture timestamps.

---

## Task 1 — Cold open (no instructions)

"You've just sat down at your desk. This is AbarVa. Go."

**Observe:**
- Do they know what they're looking at within ~15 seconds?
- Do they go to the Decision Queue unprompted?
- Do they read it as "my day" or as "a dashboard"?

**Pass:** they orient without help and treat the queue as a to-do list.
**Fail:** they ask "what am I supposed to do here?" or hunt for navigation.

---

## Task 2 — Triage

"Walk me through this queue. Which of these matters most, and why?"

**Observe:**
- Does the urgency ordering match their instinct?
- Do the headlines tell them enough to triage *without clicking*?
- Any card they'd dismiss as noise? Any trigger they expected and don't see?

**Pass:** they can rank the queue confidently from the headlines alone.
**Fail:** they must open cards to understand them, or they distrust the ordering.

---

## Task 3 — The renewal (the core scenario)

"Pick the renewal that worries you most. Open it."

**Observe (Renewal Cockpit):**
- Do they reach the **recommended posture** fast — or wade through sections first?
- Do they believe the should-cost range / incumbent-leverage read?
- Do they say "where did this number come from?" — and can they find out?
- Auto-renewal risk: do they register the notice window as urgent?

**Pass:** within ~60 seconds they can state the recommended posture and the one piece of evidence behind it, and they believe it enough to act.
**Fail:** they can't find the recommendation, or they don't trust it, or they can't trace a number.

---

## Task 4 — Act before the window closes

"It's a real renewal. What do you do next, in the product?"

**Observe:**
- Is there an obvious next action (open Negotiation Room / start a rebid / decline auto-renewal)?
- Does the path forward feel like *their* process or the product's process?

**Pass:** the next step is obvious and matches how they'd actually act.
**Fail:** dead end, or the action doesn't map to their real workflow.

---

## Task 5 — Mid-stream reality check

"A business unit head just emailed: they want to buy [a tool]. Where do you start here?"

**Observe:**
- Can they enter mid-stream, or does the product force an origination flow?
- Does the routing match their instinct?

**Pass:** they can start from "I have a business request" and get somewhere useful.
**Fail:** the product only supports clean greenfield origination.

---

## Debrief questions

1. "Did this feel like how your job actually works? Where did it not?"
2. "What would you have expected to see that wasn't there?"
3. "Would you open this Monday morning? Why / why not?"
4. "What's the one thing that would make you stop using your spreadsheet?"
5. "Where did you not trust it?"

---

## Scoring — the only metric that counts

After the session, the participant rates one statement, unprompted in their own words first, then 1–5:

> **"This is how my job actually works."**

- 5 — would use it as their operating console.
- 3 — useful, but still a tool they'd visit, not live in.
- 1 — does not fit how they work.

A score below 4 means the slice is not yet practitioner-fit — and the *why*, from the think-aloud, is the build backlog. Time-to-recommendation in Task 3 (target: under 60s) is the secondary metric.

---

## What a good test produces

Not a thumbs-up. It produces a ranked list of concrete frictions — "I expected X here," "I didn't trust Y," "this ordering is wrong" — that becomes the next build increment. The test has done its job if it changes the plan.
