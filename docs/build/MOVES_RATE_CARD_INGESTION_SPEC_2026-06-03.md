# Moves Rate Card Ingestion Spec

Status: source artifact for Lakeshore corpus grounding.

## Purpose

This spec defines how Moves should treat delivery rate cards and estimate ranges for client programs such as Lakeshore's Kyriba rollout and modernization work.

## Accepted Source Shapes

- Role and location rate tables by month, quarter, or contract period.
- SI/vendor statement-of-work staffing matrices.
- Internal capacity plans with named role bands.
- Benchmark fallback tables clearly labeled as non-client-specific.

## Required Fields

- `rate_card_id`
- `source_name`
- `vendor_or_internal_team`
- `role`
- `location_or_geo`
- `rate_type`
- `rate_amount`
- `currency`
- `effective_start`
- `effective_end`
- `confidence`
- `evidence_state`

## Governance Rules

- A benchmark fallback is never a committed client rate.
- A rate may be used for CFO-facing estimates only when source, period, currency, and role are present.
- Missing client-specific rate cards must be surfaced as an estimate caveat, not silently filled.
- Any generated Move estimate must state whether it uses client-specific rates, SI proposal rates, or benchmark fallback rates.

## Lakeshore Application

For Lakeshore, the rate-card pattern applies to:

- Kyriba implementation workstreams.
- ERP/bank connectivity remediation.
- Treasury data-quality and controls work.
- Modernization assessment and migration waves.

Until a Lakeshore-specific rate card is committed, estimates remain planning ranges.
