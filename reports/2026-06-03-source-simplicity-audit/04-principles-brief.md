# Source — Simplicity Principles Brief

One page. The doctrine that survives this audit and guards against re-cluttering. Pin every future Source product decision against it.

---

## The one rule

**Every visible element begins guilty.** It earns its place by answering one question: *does this element change what the user does next?* If not — delete, demote, or merge. We ship in **act mode**, not **explain mode**.

---

## The nine principles

1. **One page, one job.** If you can't write the page's press release in 12 words, it's doing too many jobs — fork it or merge it. (Source had four "home" pages; that's the failure this catches.)

2. **One canonical status.** A single piece of state gets *one* conveyor. Readiness, count, or lifecycle shown twice means the user has to reconcile them — and stops trusting both.

3. **Show, don't explain.** A 40-word paragraph describing a table is a confession that the table isn't self-evident. Spend the words making the table obvious instead.

4. **No internal language in the UI, ever.** Dev commands, codenames (Sentinel/Steward/Atlas as *labels*), stage numbers (Step 0), fidelity tiers (stub/outline), and correctness adjectives ("deterministic") are paper-cuts. The buyer doesn't share our vocabulary. Say what a thing *does*, not what we *call* it internally.

5. **Earn the control before you show it.** A button that's usually disabled ("Promote" with nothing to promote, "Export" with nothing authored) is noise. Hide it until it's actionable; don't gray it out.

6. **If a banner is always visible, it stops being a banner.** Persistent warnings become wallpaper — and then the user ignores the *next* warning that matters. Make it dismissible, contextual, or remove it.

7. **The chat rail is a guest, not a tenant.** It opens on demand and gets out of the way. It does not squat on 45% of the workspace by default. (Linear's command palette is the model.)

8. **The unhappy path is where polish lives.** Empty states name what will fill them. Error states give a next action ("Pick two different events →"), never a dead end. A confident header over an empty table is a broken promise.

9. **Squint + count before you ship.** Blur the screen 50% — does the eye land on one primary action? Count the chrome words — is an executive view under ~60–80? If not, something is on trial.

---

## The four verdicts (use on every new element)

- **KEEP** — load-bearing for the next decision.
- **DEMOTE** — real but secondary → tooltip, detail view, or overflow.
- **MERGE** — a sibling already says this → collapse.
- **DELETE** — no defensible purpose.

"Could be better" is not a verdict. Every element gets one of the four.

---

## Reference anchors

When a decision drifts into taste, pin it:
- **Linear** — how few words a queue needs; command-on-demand, not always-open.
- **Stripe** — executive numbers with restraint; one metric, not a tile wall.
- **Apple Notes / Maps** — negative space at scale; the unhappy path still feels calm.

Phrase the test concretely: *"Stripe would not stack four status conveyors on one page."* *"Linear would not show all 11 stages when 6 are gated."*

---

## What "good" already looks like internally

`/source/events/[eventId]/vendors/[vendorId]` (vendor detail) scored **4.0/5** — zero jargon leaks, zero redundant status conveyors. It's the internal reference for the target state. Make the rest of Source feel like that page.
