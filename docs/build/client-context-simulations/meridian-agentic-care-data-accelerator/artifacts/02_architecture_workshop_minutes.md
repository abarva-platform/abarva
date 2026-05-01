# Architecture Workshop Minutes
Date: 2026-04-24
Facilitator: AbarVa Principal Architect

## Candidate architectures discussed
1. Azure + Databricks Lakehouse with governed feature/retrieval plane.
2. Snowflake-centered modernization with externalized governance controls.
3. Hybrid Teradata coexistence with phased migration and policy guardrails.

## Comparative concerns
- Time to value: Databricks option provides faster iterative delivery with existing pilot familiarity.
- Governance overhead: Snowflake option requires additional integration for control observability parity.
- Transition risk: Hybrid path preserves continuity but prolongs duplicate operating cost.

## Control requirements
- PHI access boundaries enforced via role-based + purpose-based access controls.
- Retrieval event logging retained and queryable for audit review.
- Model and retrieval change controls tied to release approval workflow.

## Workshop outcomes
- Proceed with Azure + Databricks reference path, contingent on control evidence plan.
- Require cutover readiness gate with reconciliation evidence and rollback rehearsal.
