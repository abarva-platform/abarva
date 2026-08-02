# Tower Claude Context Contract

Date: 2026-08-02

Scope: what Tower may pass to Claude for narrative, questions, and executive synthesis.

## Allowed Role

Claude may summarize governed Tower context, explain evidence gaps, draft executive language, and propose next questions. Claude must not calculate value, promote claims, attest outcomes, or choose between conflicting source facts.

## Allowed Context

Claude context may include:

- Tenant key and display name.
- Claim counts by state.
- Known/unknown value counts.
- Evidence provenance summaries.
- Guardrail states.
- Baseline/target/actual presence.
- Attestation status.
- Source conflict status from the lineage report.
- Action candidates and module handoff labels.

## Blocked Context

Claude context must not include:

- Raw client intake rows that have not passed governance policy.
- Real client names or restricted identity mappings.
- Unknown value converted to zero.
- Conflicted promised value as a resolved fact.
- Product-owned facts that bypass the canonical model.
- Any claim marked blocked by context/corpus policy.

## Numeric Rules

Tower numbers remain deterministic. SQL/read models and metric/fact tables own values. Claude can only narrate values already proven by the governed read contract.

For the current local SkyHarbor model:

- Claude may say there are 162 value claims.
- Claude may say 162 value claims have unknown financial amount.
- Claude may say 12 claims have usage-supported evidence.
- Claude may say 150 claims are funded without baseline.
- Claude must not state a promised-value dollar total.
- Claude must not treat unknown financial value as `$0`.

## Validation Prompts To Reject

The Tower answer path should reject or caveat prompts that ask it to:

- Calculate ROI from incomplete claims.
- Choose a promised-value number from conflicting sources.
- Mark adoption as realized savings.
- Promote `usage_supported` to `claimable`.
- Ignore missing Finance or business attestation.
- Use old `cio_tower.mart_*` tables as current truth.

