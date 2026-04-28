# TRUST2 · Agent Data Access Policy Matrix

Slice ID: TRUST2
Slice name: Agent Data Access Policy Matrix
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole, Lane D in the parallel build pack)

Adds a deterministic agent data access policy matrix that defines
which agents (Nexus / Sentinel / Atlas / Steward) may use which
dataset trust / sharing levels for which canonical purposes. **No
live enforcement, no runtime hook, no audit ledger write, no model
invocation, no DB persistence, no migrations.**

## What changed

- New module
  [src/lib/admin/agent-data-access-policy.ts](../../../src/lib/admin/agent-data-access-policy.ts):
  - Agents (string-literal union):
    `'nexus' | 'sentinel' | 'atlas' | 'steward'`
  - Purposes (`AgentDataUsePurpose`): `summarize`, `recommend`,
    `cite_as_evidence`, `generate_deliverable`,
    `evaluate_governance`, `create_mission`,
    `produce_executive_brief`.
  - Local sharing-level union (`AgentDatasetSharingLevel`) mirroring
    TRUST1: `L0_public_external`, `L1_metadata_only`,
    `L2_summary_aggregate`, `L3_redacted_extract`,
    `L4_sensitive_raw_data`.
  - Local approval-state union (`AgentEvidenceApprovalState`):
    `unsubmitted`, `pending_review`, `conditionally_approved`,
    `explicit_approved`, `rejected`, `revoked`.
  - Public types: `AgentDataAccessPolicy`,
    `AgentDatasetPermission`, `AgentDataAccessDecision`,
    `AgentDataAccessBlockReason`,
    `AgentDataAccessMatrix`,
    `AgentDataAccessMatrixSummary`.
  - Public helpers: `listAgentDataAccessPolicies()`,
    `buildAgentDataAccessMatrix()`,
    `evaluateAgentDataAccess(agent, purpose, datasetLevel, approvalState)`,
    `summarizeAgentDataAccessMatrix(matrix)`.
  - Re-exports (canonical orderings):
    `AGENT_DATA_ACCESS_AGENTS_IN_ORDER`,
    `AGENT_DATA_USE_PURPOSES_IN_ORDER`,
    `AGENT_DATASET_SHARING_LEVELS_IN_ORDER`,
    `AGENT_EVIDENCE_APPROVAL_STATES_IN_ORDER`.

- New tests
  [src/__tests__/integration/admin/agent-data-access-policy.test.ts](../../../src/__tests__/integration/admin/agent-data-access-policy.test.ts):
  35 deterministic tests across 7 describe blocks covering:
  determinism, agent / purpose coverage (every agent has at least
  4 purposes), L4 sensitive raw data gating (blocked without
  explicit approval; allowed with explicit approval; outside Atlas
  / Steward envelopes regardless), `cite_as_evidence` requires a
  usable evidence trust state, `produce_executive_brief` prefers
  L2 aggregates, summary reconciliation, block-reason invariants
  (every blocked decision populates `blockReason`; every allowed
  decision populates `rationale`; rejected / revoked approval
  states block universally), and module hygiene (no imports from
  Source UI, Nexus / Sentinel / Atlas / Agent runtime, the TRUST1
  `dataset-trust-model` module, legacy `/programs`, mock.ts, auth,
  or supabase; no Date.now / Math.random / new Date / fetch; no
  anthropic / openai / pinecone references).

## Encoded policy intent

- **Steward**: policy / readiness data only. Envelope is
  `L0_public_external`, `L1_metadata_only`, `L2_summary_aggregate`.
  Authorized purposes: `summarize`, `recommend`,
  `evaluate_governance`, `create_mission`,
  `produce_executive_brief`.
- **Sentinel**: evidence candidates + patterns. Envelope spans all
  five levels (with L4 gated on `explicit_approved`). Authorized
  purposes: `summarize`, `recommend`, `cite_as_evidence`,
  `evaluate_governance`, `create_mission`.
- **Nexus**: agent-approved program / workshop / deliverable data.
  Envelope spans all five levels (with L4 gated on
  `explicit_approved`). Authorized purposes: `summarize`,
  `recommend`, `cite_as_evidence`, `generate_deliverable`,
  `create_mission`.
- **Atlas**: aggregate / approved executive signals only. Envelope
  is `L0_public_external`, `L1_metadata_only`,
  `L2_summary_aggregate`. Authorized purposes: `summarize`,
  `recommend`, `create_mission`, `produce_executive_brief`.
- **L4 sensitive raw data is blocked unless
  `approvalState === 'explicit_approved'`** — enforced for every
  agent at every purpose.
- **`cite_as_evidence` requires a usable evidence trust state**
  (`conditionally_approved` or `explicit_approved`).
- **`produce_executive_brief` prefers `L2_summary_aggregate`** —
  every authorized executive-brief permission marks L2 as
  `preferred`, and the evaluator blocks executive briefs at
  `L3_redacted_extract` / `L4_sensitive_raw_data` either via the
  envelope check (Atlas, Steward) or the explicit
  `executive_brief_prefers_aggregate` reason if the level is in
  envelope.
- **Every decision populates `rationale`**; blocked decisions also
  populate `blockReason` from the canonical
  `AgentDataAccessBlockReason` union.
- **`createdFrom: 'deterministic_agent_data_access_seed'`** appears
  on every policy and decision.

## Lane isolation note

TRUST1 (running in parallel) defines `DatasetTrustLevel` and
`DatasetTrustLadderState` in `src/lib/admin/dataset-trust-model.ts`.
That module does **not** exist on this branch. To avoid coupling the
two lanes mid-flight, this lane redeclares the unions locally as
`AgentDatasetSharingLevel` and `AgentEvidenceApprovalState`. The
integration agent reconciles the duplicate type declarations during
cherry-pick — at that point, this module's local unions can be
replaced with imports from the TRUST1 module without changing the
TRUST2 policy contract.

## What is deterministic today

- `listAgentDataAccessPolicies()` and `buildAgentDataAccessMatrix()`
  are byte-equal across repeated calls.
- The matrix emits exactly one policy per (agent, purpose) tuple
  for which the agent is authorized for the purpose. Atlas does not
  receive a `cite_as_evidence` row, etc.
- Every policy carries permissions for all 5 canonical sharing
  levels in canonical order.
- `evaluateAgentDataAccess` returns the same decision for the same
  input every call.
- `summarizeAgentDataAccessMatrix` reconciles `byAgent`,
  `byPurpose`, `permissionsRequiringExplicitApproval`, and
  `preferredAggregateForExecutiveBrief` to the policy list.

## What is NOT yet live

- No live enforcement — this is a read model that the future
  runtime tool dispatcher and Model Gateway will consult.
- No audit ledger writes — TOOL3's audit shape is not invoked here.
- No DB persistence.
- No model invocation.
- No tenant-scoped policy override path. Per-tenant policy
  customization remains deferred.
- No UI surface (Steward Setup mounts will land in a follow-up
  TRUST slice once TRUST1 / TRUST3 are reconciled).

## Honest fallbacks used

- Atlas and Steward envelopes do not include L3/L4; the policy
  matrix never claims those agents may inspect record-level data.
- Nexus is not authorized for `produce_executive_brief` (Atlas and
  Steward own that purpose), so the matrix never emits a Nexus
  executive-brief row.
- Sentinel is not authorized for `generate_deliverable` (Nexus
  owns that purpose), and Atlas / Steward are not authorized for
  `cite_as_evidence` (Nexus and Sentinel own evidence citation).
- Module imports nothing from Source UI, Nexus / Sentinel / Atlas /
  Agent runtime, the TRUST1 `dataset-trust-model` module (lane
  isolation), legacy `/programs`, mock.ts, auth, or Supabase (test
  enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/admin/agent-data-access-policy.test.ts`
  — 35 passed
- `npm run build` — pass

## Status

Code complete. Pending founder review and integration-agent
reconciliation with TRUST1.
