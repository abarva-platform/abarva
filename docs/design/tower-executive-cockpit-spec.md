# Tower executive cockpit — spec for the decision-first first screen

Status: **draft for approval**. Nothing here is built. Items 1 and 2 of the review
(first-viewport ordering, and honest freshness) shipped separately in
`docs/releases/records/2026-08-26-tower-first-viewport-truth.md`.

This spec covers the three items that need decisions rather than code: the verdict headline, the
prioritized action list, and the evidence trust ribbon. Each section states what is mechanical
(buildable now), what is a judgment call (needs an owner's answer), and where the fact-authority
rules constrain the design.

---

## The governing constraint

`AGENTS.md` is explicit: run `fact-lineage-report.mjs` before quoting any number; label a figure
that is `ONE_SOURCE`; **do not quote a `CONFLICT` figure at all**. The most recent run on the
Tower metric set returned `8 ABSENT / 4 ONE_SOURCE` in quote mode and `3 CONFLICT / 5 ONE_SOURCE /
4 ABSENT` in migration-audit mode.

That rules out one tempting shape. A headline that hardcodes
`"$0 board-claimable; $6.5M finance-validated but blocked"` would be the same class of defect as
the frozen date this release just removed: a true-sounding assertion the data does not currently
support, frozen into the source. It would also go stale silently.

**Design rule for everything below: the surface states a verdict it can defend, and degrades to a
weaker but still useful verdict when lineage cannot carry the stronger one.** A cockpit that can
say "I cannot yet claim this" is more credible to a CXO than one that always has a number.

---

## 1. Verdict headline (replaces `AI value posture`)

**Mechanical.** Derive a verdict *state* from the summary the view model already computes —
`claimableUsd`, `financeValidatedUsd`, `blockedUsd`, `promisedUsd`, open gate count. Four states:

| State | Condition | Reads as |
|---|---|---|
| `CLAIMABLE` | claimable > 0, no blocking gates | value is board-claimable |
| `BLOCKED` | finance-validated > 0, gates open | value exists, proof does not clear |
| `UNPROVEN` | promised > 0, finance-validated = 0 | investment visible, outcome unproven |
| `NOT_LOADED` | summary fields null | posture not yet built |

Each state maps to a sentence. Figures are interpolated **only** where lineage supports them, and
`ONE_SOURCE` figures render with a visible qualifier. Where lineage is `CONFLICT` or `ABSENT`, the
sentence renders without the figure — the state still communicates.

**Needs a decision:**
- **The four sentences themselves.** These are the executive voice of the product; I should not
  invent them. Suggested starting point for `BLOCKED`: *"Investment is visible. Outcome proof is
  not board-claimable."* — carried from the review, which is the right register.
- **Does the headline name the ask?** The review wants the decision, not the topic
  (*"Do not scale AI spend until Finance and outcome proof clear 9 gates"*). That is stronger and
  also more opinionated — it tells a CXO what to do, which the product may or may not want to
  assert. **This is the single biggest open question in the spec.**

## 2. Prioritized action list (replaces the `total evidence actions` count)

**Mechanical.** Render the top N with owner, gate, value held, due window, and a route to act;
demote the total to a "see all" affordance.

**Needs a decision — the ranking policy.** Cutting 675 to 5 is an editorial act, and the ordering
*is* the product's advice. Candidates, not mutually exclusive:

1. **Dollars held** — highest blocked value first. Most defensible, most CXO-legible, but biases
   toward a handful of large programs and can hide systemic small blockers.
2. **Gate age** — longest-stalled first. Surfaces organizational failure well; weak on materiality.
3. **Unblock leverage** — actions that release the most downstream claims. Best advice, hardest to
   compute, needs the dependency graph to be trustworthy first.
4. **Owner concentration** — group by owner so one person sees one list. Best for *acting*; worst
   for a board read.

Recommendation: **(1) as the default sort with (2) as a visible tiebreak**, because both are
computable from data we already trust, and the ordering can be explained in one sentence to a
sceptical CXO — which (3) currently cannot.

**Also needs a decision:** is N fixed at 5, or "everything above a materiality threshold"? Fixed 5
is cleaner to read; a threshold is more honest when there are only two things that matter.

## 3. Evidence trust ribbon

**Mechanical.** A compact strip, present on every tab, showing counts by evidence state with
drill-down. The states already exist in the read model.

**Needs a decision — what the ribbon exposes.** The review lists `ABSENT`, `ONE_SOURCE`, `CONFLICT`,
`FINANCE ATTESTED`. Two of those are fact-lineage verdicts about *our* pipeline; two are claim
attestation states about the *client's* evidence. Mixing them in one ribbon is a category error and
will read as one confidence scale when it is two.

Recommendation: **two ribbons, or one ribbon with a visible divider** — "what the client has
attested" and "what our sources agree on" are different questions, and a CXO will ask them
separately.

**Open:** does `CONFLICT` surface to the client at all, or is it ops-only? Showing it is honest and
differentiating; it also advertises internal disagreement to a buyer. This is a positioning call.

---

## Explicitly out of scope here

- **Route IA** (`/tower`, `/tower/command`, `/tower/legacy`, tenant subsurfaces). Note the earlier
  diagnosis was wrong in a way that matters: `/tenant/<slug>/tower/value` 404s *correctly* —
  `value` is not a subsurface slug. Subsurfaces are `shadow-ai`, `vendors`, `regulatory`; the six
  tabs are `?view=` params. So the work is not "wire up a missing route", it is merging two URL
  namespaces that currently look identical. Larger job, separate spec.
- **aVa as a right-side advisory rail.** Depends on the verdict headline existing first.
- **Responsive/mobile proof.** Needs a working viewport override; the in-app browser override did
  not take effect during review, so no responsive validation is claimed.

## What I need to proceed

1. The four verdict sentences, and whether the headline names the ask.
2. Ranking policy for the action list, and fixed-5 vs threshold.
3. One trust ribbon or two, and whether `CONFLICT` is client-visible.

With those three answers the rest is mechanical and can ship as one PR per section.
