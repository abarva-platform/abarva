# Tower Command Mart (Layer 5) — spec vs. what exists vs. what the page does

Source of truth for the target: the CXO value-realization mart spec — six layers, source inputs →
evidence registry → canonical facts → context pack → **command mart** → aVa context. This document
covers **Layer 5 only**, because Layer 5 is what the Command Center page reads.

Written 2026-07-23 alongside the `/tower/command` build. Two purposes:

1. Say precisely which of the page's derived values exist **only** because the current mart does not
   yet carry the spec's columns — i.e. which lines of `derive.ts` delete themselves when Layer 5
   lands.
2. Record the naming and shape divergences that will otherwise be discovered the hard way.

**Nothing here is a proposal to change the mart in this release.** The handoff prompt's rule holds:
land the UI against derived values, raise the mart change as its own release-recorded slice with its
own lineage rows.

---

## Naming

| Spec                                | Repo today                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `tower_mart_command_center`         | `cio_tower.mart_command_center`                                              |
| `tower_mart_value_funnel`           | `cio_tower.mart_value_funnel` — **different shape, see below**               |
| `tower_mart_program_decision_lanes` | `cio_tower.mart_program_decision_lanes`                                      |
| `tower_mart_ai_portfolio`           | `cio_tower.mart_ai_portfolio`                                                |
| `tower_mart_evidence_gaps`          | **no equivalent.** `cio_tower.mart_required_field_gaps` is a different table |
| `tower_mart_cxo_actions`            | `cio_tower.mart_cxo_actions`                                                 |

Also present in the repo with no spec counterpart: `cio_tower.mart_evidence_lineage` (the trace rows
the shipped Evidence tab renders). That is closer to the spec's **Layer 2 evidence registry** surfaced
directly, than to anything in Layer 5.

---

## The one structural divergence: `value_funnel`

This is the most important line in this document.

- **Spec** `tower_mart_value_funnel` is **per program**:
  `program_id, program_name, funded_amount, promised_value, usage_supported_value,
finance_validated_value, claimable_value, blocked_value, value_claim_status, blocker_reason`.
- **Repo** `mart_value_funnel` is **per stage** — five aggregate rows
  (`approved_funding`, `ai_tagged_spend`, `promised_value`, `finance_validated`,
  `realized_claimable`) with `sequence`, `stage_label`, `value_numeric`, `claim_status`, `caveat`.

Same name, different grain. The spec's table is the **per-program value chain** — exactly what the
design's program drawer renders. The repo's table is the **aggregate waterfall**.

Consequence for the build: the page's per-program chain (Promised → Usage-supported →
Finance-validated → Claimable → Blocked) is assembled from `mart_program_decision_lanes` plus
`derive.ts`, because the table that is supposed to hold it does not hold it. When the spec's version
lands, `buildWaterfallRows()` should aggregate _up_ from it rather than from the summary totals.

---

## Field-level map

### `tower_mart_command_center`

| Spec column                                                            | Repo                                                          | Page                                                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `total_it_budget` / `run_budget` / `change_budget` / `ai_tagged_spend` | `*_fy26` ✅                                                   | read                                                                                                       |
| `approved_program_count`                                               | ❌ (`approved_program_budget_fy26` is an amount, not a count) | counted from `programLanes.length`                                                                         |
| `candidate_ai_count`                                                   | `candidate_ai_opportunities` ✅                               | read                                                                                                       |
| `promised_value`                                                       | `promised_value_fy26` ✅                                      | read                                                                                                       |
| `finance_validated_value`                                              | `partial_finance_validated_value_ytd` ✅                      | read                                                                                                       |
| `claimable_value` / `realized_value_allowed`                           | `realized_value_ytd_allowed` ✅                               | read                                                                                                       |
| `primary_blocker`                                                      | ❌                                                            | not rendered as a distinct field; the design's week-read footer shows the finance-validation ratio instead |
| `next_decision`                                                        | `decision_question` ≈ ✅                                      | rendered as the page H1                                                                                    |

### `tower_mart_value_funnel` (per program)

| Spec column                                                    | Repo                           | Page                                                      |
| -------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| `funded_amount` / `promised_value` / `finance_validated_value` | on `program_decision_lanes` ✅ | read                                                      |
| **`usage_supported_value`**                                    | ❌                             | **derived** — `usageSupportedUsd()`                       |
| **`claimable_value`**                                          | ❌                             | **derived** — `claimableUsd()` from `tower_claim_allowed` |
| **`blocked_value`**                                            | ❌                             | **derived** — `blockedUsd()`                              |
| `value_claim_status`                                           | ✅                             | read                                                      |
| `blocker_reason`                                               | `decision_rationale` ≈ ✅      | read                                                      |

**All three derived money fields are specified as persisted columns.** They are the reason
`derive.ts` exists at all.

### `tower_mart_program_decision_lanes`

| Spec column                                  | Repo                                                                | Page                                                            |
| -------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| `program_id` / `program_name` / `owner_role` | ✅                                                                  | read                                                            |
| `function`                                   | ❌                                                                  | falls back to `owner_role`, labelled as the proxy it is         |
| `funding_status`                             | ❌ (`funding_status` exists on ai_portfolio, not here)              | not rendered                                                    |
| `funded_amount` / `promised_value`           | ✅                                                                  | read                                                            |
| **`usage_status`**                           | ❌ (raw `usage_metric` / `usage_actual` / `adoption_rate_pct` only) | **derived** — `usageStatus()`, 60% threshold                    |
| **`finance_validation_status`**              | ❌ (`tower_claim_allowed` only)                                     | **derived** — `financeStatus()`                                 |
| **`evidence_status`**                        | ❌                                                                  | **derived** — `evidenceMaturity()` 0–100 and `proofLevel()` 0–3 |
| `decision_lane`                              | ✅ `fund\|fix\|freeze\|stop`                                        | read                                                            |
| `next_action`                                | `required_gates[].ask` ≈ ✅                                         | read                                                            |

**Note on `watch`.** The spec's lane enum is `fund / fix / freeze / stop / watch`; the repo's
`DecisionLane` type has only the first four. The page synthesises `watch` in `laneFor()` for funded
lines with no promised value. That reclassification is presentation-only today and should become a
real mart lane value.

**Note on proof sequencing.** The current bridge exposes
`proofSequenceStatus = finance_validation_ahead_of_usage_evidence` when finance-validated value
exceeds usage-supported value. That is not an error to normalise away; it is a business state the
tenant actually has. Layer 5 should persist a status/explanation pair (or equivalent) so Tower and
aVa can explain, "Finance has validated value that usage evidence does not yet support," without
pretending the proof ladder is monotonic.

### `tower_mart_ai_portfolio`

| Spec column                                                                            | Repo                                           | Page                                                           |
| -------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| `ai_item_name` / `ai_spend_type` / `ai_spend_category` / `vendor_name` / `system_name` | ✅                                             | read                                                           |
| `funding_status`                                                                       | ✅                                             | feeds kind mapping                                             |
| `approved_spend` / `embedded_spend`                                                    | one column, `ai_tagged_spend_usd`              | read as one                                                    |
| `candidate_flag`                                                                       | via `item_kind = 'candidate_opportunity'` ≈ ✅ | read                                                           |
| `value_score` / `readiness_score` / `risk_score`                                       | ✅                                             | read (bubble axes)                                             |
| **`proof_score`**                                                                      | ❌                                             | **derived** for programs; not shown per AI item                |
| **`recommended_posture`**                                                              | ❌                                             | **derived** — `postureFor()`, a value×readiness quadrant label |

**`item_kind` is a closed four-value enum** (`funded_program`, `embedded_platform`, `usage_benefit`,
`candidate_opportunity`) and does **not** include governance. The design has five buckets. The page
maps the enum exactly and lets `ai_spend_category` promote an item to `governance`; otherwise the
design's Governance legend entry could never occur on real data.

The bridge now keeps that distinction visible instead of overwriting it:

| Diagnostic field       | Meaning                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `originalItemKind`     | the mart's raw closed-enum value                                                                       |
| `displayBucket`        | the design/display bucket after the governance-category override                                       |
| `displayBucketBasis`   | whether the bucket came from `item_kind`, `ai_spend_category`, a keyword fallback, or the safe default |
| `mappingPolicyVersion` | the mapper policy version (`tower_ai_display_bucket_v1`)                                               |

Layer 5 should persist either these diagnostics or an equivalent governed mapping view. Without
them, the page can look right while silently losing the fact that `usage_benefit` is semantically
different from `embedded_platform`, or that "Governance" was a category overlay rather than an enum
kind.

### `tower_mart_ai_spend_attribution` — missing

The command center can report a portfolio-level AI-tagged total while every item in
`mart_ai_portfolio` carries `ai_tagged_spend_usd = 0`. That is not a charting problem; it is a
governed attribution gap.

Layer 5 needs a reconciliation contract:

```text
portfolio AI-tagged spend
= attributed initiative spend
+ shared platform spend
+ unallocated AI-tagged spend
```

Until that table exists, the page must not distribute the portfolio total proportionally across
initiatives. It uses constant-radius bubbles when per-item spend is missing and states that the
portfolio supports position/value-readiness evidence, not spend concentration.

Target statuses:

| Status                | Meaning                                               |
| --------------------- | ----------------------------------------------------- |
| `item_attributed`     | spend is tied to a governed AI portfolio item         |
| `category_attributed` | spend is tied to an AI category, not an initiative    |
| `shared_platform`     | spend supports multiple initiatives/platform services |
| `portfolio_only`      | spend is known only at the portfolio level            |
| `unattributed`        | spend cannot yet be tied to governed evidence         |

### Portfolio count reconciliation

The current stack can expose different numbers at different layers: source candidates, canonical
items, mart items, rows returned by the runtime reader, display candidates and plotted bubbles. That
must be explicit rather than explained by the UI after the fact.

Layer 5 or the runtime reader should persist/report:

```text
source_item_count
canonical_item_count
mart_item_count
eligible_item_count
display_candidate_count
plotted_item_count
excluded_item_count
exclusion_reasons
```

The Command Center bridge now shows only a governed top-N candidate slice and records the
reconciliation in `portfolioCounts`; candidates do not share the default funded/embedded visual
surface.

### `tower_mart_evidence_gaps` — **the biggest gap**

The spec's table and the repo's `mart_required_field_gaps` are different things.

| Spec column        | `mart_required_field_gaps`                             |
| ------------------ | ------------------------------------------------------ |
| `business_area`    | `mart_table` (a table name, not a business area)       |
| `program_id`       | `mart_record_key` (a synthetic key)                    |
| `missing_evidence` | `required_field` (a column name)                       |
| `why_it_matters`   | `remediation_action` (an instruction, not a rationale) |
| `blocked_decision` | ❌                                                     |
| `owner_role`       | `owner_hint` ≈                                         |
| `priority`         | `severity` ≈                                           |
| `due_window`       | ❌                                                     |

The repo's table is a **data-quality gap list** — "this mart column is unpopulated". The spec's is a
**business evidence-gap list** — "this proof is missing, here is why it matters, here is the decision
it blocks, here is who owns it and by when".

This is why the page's Evidence tab is 75% empty on the live tenant: three of its four questions
("what is missing / who owns it / what is blocked") are answerable only from the spec's table, and
`mart_required_field_gaps` has zero rows there anyway. The page currently synthesises
`blockedDecision` from the blocking flag and the program name, which is the honest best available
and clearly weaker than a governed sentence.

### `tower_mart_cxo_actions`

| Spec column          | Repo               | Page                                                         |
| -------------------- | ------------------ | ------------------------------------------------------------ |
| `owner_role`         | `owner_hint` ✅    | read, routes the five owner columns                          |
| `decision_required`  | ❌                 | falls back to the title                                      |
| `why_now`            | `action_body` ≈ ✅ | read                                                         |
| `linked_program`     | ❌                 | rendered as "not linked"                                     |
| `linked_gap`         | ❌                 | not rendered                                                 |
| `recommended_action` | `title` ≈ ✅       | read                                                         |
| **`target_date`**    | ❌                 | rendered "No due window recorded" — listed in `unknownSlots` |
| `status`             | ❌                 | not rendered                                                 |

The design's action drawer has four distinct fields (decision required / due / linked program /
owner). Two of the four do not exist in the repo table, which is why that drawer currently shows the
title twice and an honest unknown.

---

## What this means for `derive.ts`

Everything in `derive.ts` is a **bridge**, not a model. When Layer 5 lands as specified:

| Function                                               | Becomes                                           |
| ------------------------------------------------------ | ------------------------------------------------- |
| `usageSupportedUsd()`                                  | a read of `usage_supported_value`                 |
| `claimableUsd()`                                       | a read of `claimable_value`                       |
| `blockedUsd()`                                         | a read of `blocked_value`                         |
| `usageStatus()`                                        | a read of `usage_status`                          |
| `financeStatus()`                                      | a read of `finance_validation_status`             |
| `evidenceMaturity()` / `proofLevel()`                  | a read of `evidence_status` / `proof_score`       |
| `proofSequenceStatus()` / `proofSequenceExplanation()` | a read of the persisted proof-sequence diagnostic |
| `postureFor()`                                         | a read of `recommended_posture`                   |
| `laneFor()`'s `watch` synthesis                        | a real `decision_lane` value                      |

Two of these carry a live-verified constraint that the mart implementation must honour, or the two
Tower surfaces will disagree:

1. **`usage_supported_value` must be adoption-evidenced, not floored at finance-validated.** The
   shipped Tower reports `Usage-supported $0` beside `Finance-validated $3.8M` for the Healthcare
   Composite Demo tenant. The page matches that. A mart implementation that floors usage-supported
   at the finance figure would report ~$3.8M and contradict both.
2. **`finance_validated_value > usage_supported_value` is legal and must not be normalised away.**
   It is the real state of that tenant and it is worth surfacing — Finance has validated value that
   no usage evidence supports.

## Layers 1–4 and 6

Out of scope for the page, but noted so the boundary is explicit:

- **Layer 2 evidence registry** — the repo's nearest thing is `mart_evidence_lineage`
  (`source_file` / `source_row` / `source_system` / `caveat`). It has no `confidence`,
  `attestation_status` or `evidence_owner`, all of which the spec requires and which the page's
  Evidence tab would render directly if present.
- **Layer 4 context pack** — `tower_context_pack` is not the same object as the repo's
  `TowerContextPack` used by the Claude story path; do not conflate them when the spec lands.
- **Layer 6 aVa context** — `allowed_claims` / `blocked_claims` / `source_evidence_refs` has no
  equivalent today. The Command Center page does not call aVa, so this build neither uses nor
  blocks it.

## The cardinal rule, as it applies to this page

The page states no row counts, fact counts, node counts or edge counts anywhere. Counts that do
appear are business counts — programs, AI initiatives, gaps, actions, decisions waiting — never
storage counts. The one place a count could have leaked (the Risk posture tile) reads "programs
cannot claim value today", not "N gap rows".
