# Context & Corpus Validated Agent Bundle (2026-06-08) — PR-5

The runtime seam. Every agent context bundle should pass through
`buildValidatedAgentContextBundle` before it reaches a model, so ungoverned
context cannot be put in front of an agent — no matter which agent (Nexus,
Sentinel, Atlas, Source, Tower, Steward) or which code path assembles it.

## The seam

`src/lib/governance/agent-context-bundle.ts`

- `GovernedCandidate` — the governance-relevant subset known at bundle-assembly
  time (id, client_key, tenant_id, source_layer, source_basis, classification,
  retrievability, agent_readiness_status, confidence_level,
  cited_render_verified_at, citations).
- `buildValidatedAgentContextBundle(candidates, options?)` → `ValidatedAgentContextBundle`
  - runs each candidate through `evaluateGovernedObject` (the PR-1 contract);
  - **fences sensitive (pii/phi/restricted) candidates by default** — the
    agent-bundle half of the `SENSITIVE_CLASSIFICATIONS` rule (the corpus half
    lives in `evaluateGovernedObject`); opt in with `{ allowSensitive: true }`
    only with clearance;
  - splits candidates into `usable` (may reach the model) and `blocked` (never
    does), with a bundle-level `decision` (pass / warn / block), an
    `agentReadyCount`, and de-duplicated `citations`.
- `buildDecisionReasoningRequest({ task, agent, tenantKey, candidates })` →
  `DecisionReasoningRequest` — wraps the validated bundle as the `retrievalBundle`
  inside the reasoning envelope an agent receives.

## Adapters (the three historical shapes → one)

`src/lib/governance/context-bundle-adapters.ts`

- `fromEnterpriseBundle` / `fromEnterpriseItem` — the broker's
  `EnterpriseAgentContextBundle` items.
- `fromAskSource` — Sentinel `AskSource` (numeric confidence → confidence level).

Each adapter is conservative: an item whose governance fields aren't known yet
defaults to the truthful floor (`not_reviewed` / `committed_not_indexed`), never
to `agent_ready`.

## Wiring (additive, non-breaking)

`src/lib/knowledge/agent-context-broker.ts` — both
`buildEnterpriseAgentContextBundle` and `buildEnterpriseAgentContextBundleAsync`
now attach an optional `governance: ValidatedAgentContextBundle` to every bundle
they return (via `withGovernance`). The field is additive: existing consumers
ignore it; governance-aware callers read `governance.usable` and never surface
`governance.blocked` to a model. No `items` are mutated.

## Why this matters for the gate

With one chokepoint, the PR-4 `agent-readiness` CI check can be tightened to
require `buildValidatedAgentContextBundle` at any site that mints `agent_ready` —
closing the loop so a future change cannot route around the contract.

## Follow-on

- Tighten the PR-4 `agent-readiness` check to require this call site once the
  Sentinel/Nexus runtime paths are migrated onto it.
- Populate `retrievability` / `cited_render_verified_at` from the PR-3 readiness
  ledger so `agentReadyCount` reflects real, earned readiness.
