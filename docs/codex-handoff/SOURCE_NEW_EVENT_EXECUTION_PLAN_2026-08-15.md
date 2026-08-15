# Source New Event Execution Plan — Proof Lane and Backlog Control

## Status

Active execution plan. Created after the S7 cleanup merge so the next work is not another code-hygiene pass by default.

## Immediate Decisions

1. Merge PR #6349 now because it is isolated, green, and removes only an unreachable Source presentation panel.
2. Treat production proof repair and backlog consolidation as the next two moves before further feature implementation.
3. Do not claim live proof from PR checks or deploy completion alone. Live proof requires a successful signed-in production crawl/gauntlet or an explicitly documented auth blocker.

## Phase 0 — Close The Safe Cleanup

**State:** merged.

- PR: #6349
- Merge commit: `11300c4a9d95b01577547e264ea545667a9e1cd0`
- Scope: removed one dormant Source agent panel and reduced the reachability baseline from 96 to 95.
- Product risk: low. No workflow persistence, data-plane, migration, feature flag, or environment behavior changed.
- Required proof still pending at plan creation: ACA main deploy for `11300c4a`, runtime invariant, post-deploy crawl.

## Phase 1 — Repair The Signed-In Proof Lane

**Primary blocker:** Atlas production CXO gauntlet failed before tenant turns because Clerk blocked the browser ticket sign-in with "You have been banned." That means the product surface was not evaluated.

**Root cause direction:** The Atlas gauntlet was still using legacy human demo emails, while the post-deploy crawler already uses durable non-human agent identities and a Clerk testing-token bootstrap. The proof lane should use agent identities, not human personas.

**Execution slice P1-A:**

- Add a durable Apex automation identity to the existing `AGENT_CLIENT_LOGINS` roster.
- Switch the Atlas gauntlet tenant emails to agent identities for Apex, Meridian, and SkyHarbor.
- Install the Clerk testing-token interceptor before ticket sign-in, matching the stronger post-deploy crawl path.
- Fail with an explicit operator remediation message if an automation account is missing or banned.

**Operator gate if live run still fails:**

Run the existing controlled Clerk-only reconciler from a secret-bearing environment:

```bash
npx tsx scripts/provision-cxo-personas.ts --agents --clerk-only --apply
```

That command only reconciles Clerk users for the agent roster and unbans existing agent accounts. It does not write client data, Source facts, workflow persistence, or tenant projections.

**Acceptance:**

- Atlas gauntlet reaches tenant sessions for all configured tenants.
- Smoke profile runs at least one authenticated tenant question per tenant.
- Full profile records nonzero turns and no auth-bootstrap aborts.
- Any product answer failures are separated from auth-bootstrap failures.

## Phase 2 — Consolidate The Source Backlog

**Problem:** Source backlog entries are split across old Source OS plans, Source Commercial backlog, ad hoc handoff docs, and duplicated SRC IDs. That makes execution look busy while the product-value path is unclear.

**Canonical backlog order:**

1. Proof lane reliability: signed-in gauntlet, runtime invariant, post-deploy crawl, and explicit auth blockers.
2. New Event 11-stage workflow UX: stage tree, active substep tabs, required/optional evidence, single continue gate, guidebook per stage.
3. Vendor response intelligence: upload large response packages, parse requested-answer coverage, extract exceptions, score readiness, and produce follow-up questions.
4. Evaluation engine: evidence-backed scoring, weighting, rater submissions, variance, and disqualification rationale.
5. Pricing and BAFO leverage: normalized pricing, comparability gaps, conservative/base/stretch negotiation scenarios, walk-away guardrails.
6. Selection readiness: deterministic ready/blocked/missing/next-action model and panel.
7. Contract 360 optimization: "why this contract first," source-system evidence graph, leakage/avoided-cost/negotiated-improvement ledgers.
8. Advisory story pack: executive story, value bridge, commercial opportunity map, do-nothing vs action scenario, procurement appendix.
9. Transition and Value: KT readiness, Day 1 readiness, and Tower/Finance-confirmed realized value.
10. Operator hygiene: archive stale Source events and facts without deleting audit records.

**Backlog consolidation acceptance:**

- One canonical backlog file has unique IDs, owner lane, dependencies, proof bar, and demo impact rank.
- Old duplicate IDs are either renamed, linked, or marked superseded.
- Every feature slice says what is explicitly out of scope.
- Every feature slice distinguishes deterministic facts from generated narrative.

## Phase 3 — Build In Value Order

After proof and backlog control, build the value-driving features in small PRs:

1. Scope-stage workflow reference implementation.
2. Responses upload/readiness/parsing contract.
3. Evaluation evidence-backed score model.
4. Pricing comparability and missing-price drilldown.
5. BAFO leverage scenarios.
6. Selection readiness gate.
7. Executive Decision board pack.
8. Value handoff to Tower/Finance confirmation.

## Standing Proof Bar

- PR checks are not live proof.
- ACA deploy completion is not live proof.
- HTTP 200 is not live proof.
- Signed-in route/crawl/gauntlet evidence is required for protected product surfaces.
- Any auth blocker must be named as auth-blocked, not product-passed.

## Current Known Hard Gate

The Atlas production CXO gauntlet must be rerun after the proof-lane patch is merged and deployed. Until then, the latest gauntlet result remains auth-blocked and CXO answer quality is unverified for that run.
