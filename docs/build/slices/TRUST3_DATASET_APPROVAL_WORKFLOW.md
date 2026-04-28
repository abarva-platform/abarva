# TRUST3 · Dataset Approval Workflow

Slice ID: TRUST3
Slice name: Dataset Approval Workflow
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole, Lane F in the parallel build pack)

Adds a deterministic dataset approval workflow read model that defines
how a dataset moves from `loaded` (TRUST1 ladder state) toward
`agent-usable`, `evidence-usable`, and `decision-grade` use. **No DB
writes, no migrations, no live runtime, no audit ledger writes, no
model invocation, no tool dispatcher hook, no Steward runtime.**

## What changed

- New module
  [src/lib/admin/dataset-approval-workflow.ts](../../../src/lib/admin/dataset-approval-workflow.ts):
  - States (`DatasetApprovalState`, string-literal union — 11 values
    in canonical order):
    `'requested' | 'owner_review' | 'security_review' | 'governance_review' | 'approved_for_summary' | 'approved_for_evidence' | 'approved_for_agent_use' | 'approved_for_deliverables' | 'rejected' | 'revoked' | 'expired'`.
  - Roles (`DatasetApprovalRole`):
    `'data_owner' | 'security_review_lead' | 'governance_review_lead' | 'tenant_admin' | 'abarva_steward'`.
  - Other public types: `DatasetApprovalRequest`,
    `DatasetApprovalDecision`, `DatasetApprovalCondition`,
    `DatasetApprovalAuditBasis`, `DatasetApprovalBlockReason`,
    `DatasetApprovalStateDescriptor`,
    `DatasetApprovalRoleDescriptor`,
    `DatasetApprovalWorkflow`,
    `DatasetApprovalWorkflowSummary`.
  - Helpers: `buildDatasetApprovalWorkflow()`,
    `evaluateDatasetApprovalRequest(request)`,
    `summarizeDatasetApprovals(decisions)`,
    `getRevokedOrExpiredDatasets(decisions)`.
  - Re-exports (canonical orderings):
    `DATASET_APPROVAL_STATES_IN_ORDER`,
    `DATASET_APPROVAL_ROLES_IN_ORDER`,
    `DATASET_APPROVAL_PURPOSES_IN_ORDER`.
  - createdFrom: `'deterministic_dataset_approval_workflow_seed'`.

- New tests
  [src/__tests__/integration/admin/dataset-approval-workflow.test.ts](../../../src/__tests__/integration/admin/dataset-approval-workflow.test.ts):
  37 deterministic tests across 9 describe blocks covering: byte-equal
  determinism (no `Date.now` / `Math.random` / `new Date` / `fetch`);
  every one of the 11 canonical states represented in fixture and
  catalog; L4 sensitive raw data requires both `data_owner` AND
  `governance_review_lead` reviews (each missing reviewer surfaces a
  distinct block reason); revoked / expired / rejected blocks ALL use
  across every purpose (`summary_use`, `evidence_use`, `agent_use`,
  `deliverable_use`); `approved_for_summary` does NOT confer
  `agent_use`; deliverable use requires both
  `approved_for_deliverables` AND evidence approval (recorded as a
  governance review); every decision returns `rationale` plus at
  least one `auditBasis`; module hygiene (type-only import of
  `DatasetTrustLevel` from TRUST1; no value imports from
  `dataset-trust-model`; no Source UI / Nexus / Sentinel / Atlas /
  Agent runtime imports; no auth / supabase / programs mocks; no
  Anthropic / OpenAI / Pinecone references).

## Encoded rules

- **Agent use requires explicit `approved_for_agent_use`** — it is
  not derivable from `approved_for_summary`. (The state
  `approved_for_deliverables` is the most permissive non-terminal
  state and implicitly grants agent use as part of the deliverable
  chain.)
- **Deliverable use requires `approved_for_deliverables` AND
  `approved_for_evidence`** — encoded as: state must be
  `approved_for_deliverables` AND the reviews list must include
  `governance_review_lead` (the role responsible for evidence-grade
  sign-off). Either missing surfaces a distinct block reason.
- **L4 sensitive raw data requires BOTH `data_owner` AND
  `governance_review_lead` reviews** — the audit-basis tag
  `l4_requires_owner_and_governance` is emitted for every L4 request
  regardless of state. Either reviewer missing surfaces a distinct
  block reason.
- **`revoked`, `expired`, or `rejected` blocks ALL use** — every
  purpose at every trust level returns `permitted: false` with
  `state_revoked` / `state_expired` / `state_rejected` in
  `blockReasons` and the matching `*_blocks_all_use` audit basis.
- **Review-in-progress states grant no purpose** — `requested`,
  `owner_review`, `security_review`, and `governance_review` block
  with `review_in_progress`.
- **Every decision returns `rationale` + at least one `auditBasis`
  tag** — `auditBasis` is the canonical machine-readable trail; the
  rationale is the single-sentence human-readable summary.
- **`createdFrom: 'deterministic_dataset_approval_workflow_seed'`**
  appears on every decision returned by
  `evaluateDatasetApprovalRequest`.

## Lane F · TRUST1 / TRUST2 dependency note

- TRUST1 and TRUST2 already exist on this branch from PR #280.
- TRUST3 takes a **type-only** import of `DatasetTrustLevel` from
  TRUST1 (`src/lib/admin/dataset-trust-model.ts`) so the L4 rule is
  named in the same vocabulary as the dataset trust catalog. No value
  is imported, no runtime coupling is introduced.
- TRUST3's `DatasetApprovalState` (11-value union) is intentionally
  distinct from TRUST1's narrower `DatasetApprovalState` (6-value
  union scoped to the trust-decision evaluator). Consumers should
  import the workflow union from
  `src/lib/admin/dataset-approval-workflow.ts` and the trust-decision
  union from `src/lib/admin/dataset-trust-model.ts` according to
  intent. No module imports both unions today.
- TRUST2's `AgentEvidenceApprovalState` is the policy-matrix-local
  union and is unchanged by TRUST3.

## What is deterministic today

- `buildDatasetApprovalWorkflow()` is byte-equal across repeated
  calls.
- `evaluateDatasetApprovalRequest(request)` returns the same decision
  for the same input every call.
- `summarizeDatasetApprovals(decisions)` reconciles `permittedTotal`
  + `blockedTotal` to `total` and exposes `byState` / `byPurpose`
  buckets covering every canonical key.
- `getRevokedOrExpiredDatasets(decisions)` returns exactly the
  revoked / expired subset with no other state ever leaking through.

## What is NOT yet live

- No live enforcement — the workflow is a read model that the future
  Steward UI, runtime tool dispatcher, and Model Gateway will
  consult.
- No DB persistence — approval requests, decisions, and conditions
  are not written anywhere.
- No audit ledger writes — TOOL3's audit shape is not invoked here.
- No model invocation, no live retrieval, no tenant-scoped policy
  override path.
- No UI surface — Steward Setup mounts will land in a follow-up
  TRUST slice once TRUST3 is reconciled.

## Honest fallbacks used

- `evidence_use` is granted by `approved_for_evidence`,
  `approved_for_agent_use`, and `approved_for_deliverables`; it is
  not granted by `approved_for_summary` alone.
- The 4-purpose (`summary_use`, `evidence_use`, `agent_use`,
  `deliverable_use`) vocabulary mirrors the spirit of TRUST2's
  `AgentDataUsePurpose` but is workflow-local; nothing is imported
  from TRUST2.
- L4 rule applies to the request shape regardless of state. A
  `requested` L4 dataset still surfaces the L4 audit-basis tag so
  reviewers can see the chain on intake.
- Module imports nothing from Source UI, Nexus / Sentinel / Atlas /
  Agent runtime, legacy `/programs`, mock.ts, auth, or Supabase
  (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/admin/dataset-approval-workflow.test.ts`
  — 37 passed
- `npm run build` — pass

## Status

Code complete. Pending founder review.
