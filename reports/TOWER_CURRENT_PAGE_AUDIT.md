# Tower Current Page Audit

Date: 2026-08-03

## Executive Read

Tower currently renders the right question, but the page-by-page design does not yet handle the new data model's sparse value state well. The new model says: claims exist, usage/spend observations exist, but governed baseline, target, actual value, and attestation are not loaded. The UI translates that into repeated “Unknown” cards and tables, which reads like a broken page.

The authenticated screenshots supplied on 2026-08-02 also show a layout bug: Tower content is clipped on the left while the global Nexus nav remains anchored. The first hardening fix in this branch makes the Tower flex shell horizontally shrinkable and makes the tab rail resilient.

## Page Map

| Tab                 | Current data source                                                                        | Current behavior                                                                                            | Page-level judgment                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Command Center      | `tower.value_claim`, `tower.metric_observation`, `raw_enterprise_it.it_budget_allocations` | Shows budget and AI spend, then “Unknown” value posture because no claims have calculated value.            | Keep, but add a clear “claim ledger incomplete” state before tiles.                         |
| Value Proof         | Derived from `tower.value_claim` and program rows                                          | Correctly withholds waterfall when all value is unknown. Empty blocker table says no dollar blocker exists. | Honest but visually weak; should make “value proof not quantified yet” the dominant state.  |
| Decision Lanes      | `tower.value_claim` joined to `tower.tracked_subject`                                      | Program table shows many `$0` funded values and unknown proof states.                                       | Needs a “program exists, value ledger missing” lane, not just Fix/Freeze/Stop styling.      |
| AI Portfolio        | AI metrics from `tower.metric_observation` plus AI subjects                                | Has strong usage/admin export data, but value posture is still blocked by missing outcome evidence.         | Useful, but must separate adoption/usage evidence from business value proof more loudly.    |
| Evidence            | `tower.metric_provenance` plus derived business evidence gaps                              | “What exists” has provenance rows. Other questions derive repetitive gaps from claims with missing values.  | Needs a real evidence-gap projection. Current derivation is a bridge, not the final design. |
| Recommended Actions | Derived from claim summary                                                                 | Produces generic actions: capture baselines, require attestation, keep unknown value out of totals.         | Correct, but too generic for an executive action memo until owners and field gaps are real. |

## Mapping To New Data Model

| New model object           | Tower page use                                                 | Status                                                                 |
| -------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `doc.extraction`           | Not directly rendered in the command center.                   | Existing tables exist, but page does not yet expose document trace.    |
| `tower.metric_observation` | Budget, AI usage, cloud, KPI, project observations.            | Populated and actively read.                                           |
| `tower.metric_provenance`  | Evidence facts.                                                | Populated, but only 5 provenance rows and all `not_attested`.          |
| `tower.value_claim`        | Claim states, known/unknown value, baseline/target/actual IDs. | Populated with 162 claims, but no calculated value or observation IDs. |
| `narrative.finding_result` | Not used by current command center.                            | Gap for page-level deterministic findings.                             |
| `narrative.artifact`       | aVa shell can synthesize, but page body is deterministic.      | Not part of the current page mapping.                                  |
| `governance.review_event`  | Not rendered.                                                  | Gap for Finance/business attestation trail.                            |

## Immediate Design Defects

1. **Horizontal clipping:** Fixed shell children lacked `min-width: 0`, and the tab row did not have a horizontal overflow contract.
2. **Sparse-state overload:** Every tab tries to render dense final-state controls even when the claim layer is not decision-ready.
3. **Unknown value repetition:** The same root fact, “no governed financial amount,” appears dozens of times as row content.
4. **No true gap ledger:** `requiredFieldGaps` is empty; evidence pages should not pretend derived text is a full audit trail.
5. **Stale language:** Active Tower contracts had `cio_tower.mart_*` wording at audit start; this branch removes it from command-center comments and aVa context.

## Fix Started In This Branch

The first code change is limited to layout safety:

- `.root`, `.stage`, `.wrap`, `.dashTop`, `.bodyregion`, `.view`, and `.card` now carry `min-width: 0`.
- `.tabs` now allows horizontal overflow instead of forcing the whole Tower surface to clip.
- The CSS contract test now enforces these rules.

This does not redesign the six pages yet; it removes the most obvious page-shell failure shown in the screenshots.

## Page-By-Page Redesign Direction

1. Command Center: lead with “claim ledger incomplete” when all values are unknown, then show budget/usage as context.
2. Value Proof: make “financial value unknown” a governed state panel, not a blank chart substitute.
3. Decision Lanes: introduce a `value_evidence_missing` posture before forcing all rows into Fix.
4. AI Portfolio: show adoption/usage as “evidence to investigate,” with a hard visual boundary before value claims.
5. Evidence: bind to a real field/gap ledger with owner, source object, missing field, blocked decision, and trace.
6. Recommended Actions: group by actual owner and missing object, not only generic summary actions.
