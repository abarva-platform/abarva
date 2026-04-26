# TRUST1 · Dataset Trust Model + Data Sharing Levels

Slice ID: TRUST1
Slice name: Dataset Trust Model + Data Sharing Levels
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Adds a deterministic dataset trust read model that defines progressive
client data sharing levels and the dataset trust ladder. The intent is
to let clients engage AbarVa **without granting broad raw-data
access** — sharing starts at metadata or aggregates, agent use is
denied by default, evidence is supplied via manifests, and L4 raw
data requires explicit named approval.

**No live connector sync, no upload pipeline, no production evidence
registry, no DB persistence, no Steward runtime, no model calls, no
migrations.**

## What changed

- New module
  [src/lib/admin/dataset-trust-model.ts](../../../src/lib/admin/dataset-trust-model.ts):
  - Public types: `DatasetTrustLevel` (5 levels: L0–L4),
    `DatasetTrustLadderState` (5 ladder states: loaded → available →
    usable_evidence → agent_usable → decision_grade),
    `DatasetSensitivity`, `DatasetAgentUsePolicy`,
    `DatasetEvidenceUsePolicy`, `DatasetApprovalState`,
    `DatasetTrustDecision`, `DatasetSharingLevelDescriptor`,
    `DatasetTrustLadderDescriptor`, `DatasetTrustModel`,
    `DatasetTrustDecisionInput`, `DatasetTrustReadinessSummary`.
  - Public helpers:
    - `listDatasetSharingLevels()` — canonical L0–L4 catalog in
      ordinal order.
    - `buildDatasetTrustModel()` — full sharing level + ladder +
      rule catalog.
    - `evaluateDatasetTrustDecision(input)` — pure decision engine
      that returns permitted/blocked with deterministic reasons and
      Steward-facing guidance.
    - `summarizeDatasetTrustReadiness(items)` — aggregator across
      many decisions.
  - Re-exports: `DATASET_SHARING_LEVELS_IN_ORDER`,
    `DATASET_TRUST_LADDER_STATES_IN_ORDER`,
    `DATASET_APPROVAL_STATES_IN_ORDER`.
  - All output carries `createdFrom:
    'deterministic_dataset_trust_seed'`.

- New tests
  [src/__tests__/integration/admin/dataset-trust-model.test.ts](../../../src/__tests__/integration/admin/dataset-trust-model.test.ts):
  33 deterministic tests across 8 describe blocks covering
  determinism (byte-equal serialization), all 5 sharing levels +
  all 5 ladder states present in canonical ordinal order, only L4
  marks `rawDataExposed` and `approvalRequired`, only `agent_usable`
  / `decision_grade` permit agent use, L4 raw-record reads require
  an `approved` approval (and `denied` / `expired` block via
  `rule_no_fake_approval`), L1 metadata-only supports low-risk
  discovery without raw access, agent use blocked when no policy is
  attached, decision shape validation, summary aggregation, and
  module hygiene (no Source UI / Nexus / Sentinel / Atlas / Agent
  runtime / legacy programs / mock.ts / auth / supabase imports;
  no `Date.now` / `Math.random` / `new Date` / `fetch` /
  anthropic / openai / pinecone runtime).

## Canonical sharing levels

| Level | Label | Raw data exposed | Approval required | Default agent-use policy |
| --- | --- | --- | --- | --- |
| L0_public_external | Public / external | no | no | metadata_only |
| L1_metadata_only | Metadata only | no | no | metadata_only |
| L2_summary_aggregate | Summary / aggregate | no | no | aggregate_only |
| L3_redacted_extract | Redacted extract | no | no | redacted_extract_only |
| L4_sensitive_raw_data | Sensitive raw data | yes | yes | raw_with_named_approval |

## Canonical trust ladder

| State | Permits agent use | Permits decision use |
| --- | --- | --- |
| loaded | no | no |
| available | no | no |
| usable_evidence | no | no |
| agent_usable | yes | no |
| decision_grade | yes | yes |

## Rules encoded (test enforced)

- `loaded ≠ usable` — loaded only is never sufficient for downstream
  use.
- `available ≠ agent-usable` — discoverable metadata is not
  agent-runtime input.
- Raw record reads are not the default — sharing starts at metadata
  or aggregates.
- Evidence is supplied via manifests by default, not raw records.
- Agent use is denied by default; named policies unlock specific
  shapes only.
- L4 sensitive raw data requires explicit named approval before any
  read.
- Approval state is never fabricated; `denied` / `expired` blocks any
  L4 use outright (`rule_no_fake_approval`).

## What is deterministic today

- Trust model catalog is byte-equal across repeated calls
  (`JSON.stringify` equality test enforced).
- All decisions carry `createdFrom: 'deterministic_dataset_trust_seed'`.
- Permitted decisions return an empty `reasons` list; blocked
  decisions always carry a non-empty `reasons` list.
- Guidance strings are static and chosen deterministically from the
  reason set.

## What is NOT yet live

- No live dataset binding — this is a pure decision contract; ADM3
  inventory items do not yet carry `trustLevel` / `ladderState`
  fields. A future slice can attach these without changing the
  TRUST1 contract.
- No persisted approval ledger — `approvalState` is supplied by the
  caller; no DB write occurs here.
- No Steward runtime — guidance is authored static text.
- No model calls.

## What is deferred to future slices

- **TRUST2 (future) — Dataset trust attachment**: extend
  `DatasetInventoryItem` (ADM3) with `trustLevel`,
  `ladderState`, `sensitivity`, `agentUsePolicy`,
  `evidenceUsePolicy`, and `approvalState` fields. No TRUST1
  contract change required.
- **Approval ledger (future)**: persist named approvals against
  L4 datasets. The TRUST1 evaluator already accepts an approval
  state and refuses to fabricate one.
- **UI surface (future)**: render the trust ladder + sharing level
  badges in the Steward dataset explorer.

## Honest fallbacks used

- Unknown trust level / ladder state surfaces an explicit
  `unknown_trust_level` / `unknown_ladder_state` reason and blocks
  the decision rather than silently allowing it.
- Missing evidence manifests at usable_evidence-or-above ladder
  states surface `rule_evidence_requires_manifest` rather than
  permitting a citation against raw records.
- Module imports nothing from Source UI, Nexus / Sentinel / Atlas /
  Agent runtime, legacy `/programs`, mock.ts, auth, or Supabase
  (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/admin/dataset-trust-model.test.ts` — 33 passed
- `npm run build` — pass

## Status

Code complete. Pending founder review.
