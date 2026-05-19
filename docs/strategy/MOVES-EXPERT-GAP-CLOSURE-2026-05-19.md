# Moves Expert Gap Closure — 2026-05-19

## Purpose

This closes the four open gaps identified after the Moves Expert Kernel landed:

1. Expert calibration
2. Industry / archetype depth
3. Interactive advisory behavior
4. Outcome calibration

It also converts the parked Sentinel G7 tense-guard item from "wait for telemetry"
into an auditable telemetry-to-allowlist path.

## What Changed

| Gap | Closure |
|---|---|
| Expert calibration | Added `expert-review-calibration.ts`: requires multiple practitioner reviews, including finance and delivery / transformation lenses, before a business case is accepted. |
| Industry depth | Added `use-case-archetype-playbooks.ts`: eight major AI-bet archetype playbooks with diagnostic questions, baseline metrics, kill conditions, value drivers, and Tower measurements. |
| Interactive advisory | Added `advisory-session.ts`: turns an unfundable business case into next-best advisory actions, prioritizing high-sensitivity seed gaps such as cost-per-contact. |
| Outcome calibration | Added `outcome-calibration.ts`: compares Tower actuals against forecast, emits privacy-safe bands, and recommends how future priors should adjust. |
| Sentinel G7 | Added `tense-guard-allowlist.ts`: creates allowlist candidates only from sufficient false-positive telemetry; no automatic allowlisting from anecdote. |

## Apex Behavior

For Apex Contact Center AI Routing, the next-best advisory action is still to close
the cost-per-contact baseline. That is intentional: the kernel does not fabricate
payback while the monetization input is missing.

## Validation

- Expert Kernel + G7 tests: `127` passing
- Added tests for calibration, archetype coverage, advisory actions, outcome
  calibration, and G7 allowlist recommendation thresholds.

## Remaining Truth

These modules close the product capability gaps in code, but they do not claim that
external practitioners have already reviewed the case or that Tower actuals already
exist. Instead, they make both gates explicit, auditable, and enforceable.
