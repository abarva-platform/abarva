# Few-Shot Example Library

Version: 2026-05-09
Status: implemented training baseline

## Purpose

The output contract tells agents what to do. Few-shot examples show them what good looks like. The runtime training library lives in `src/lib/agent/output-discipline/few-shot-examples.ts` and is derived from the 60-question golden fixture set.

## Coverage

The library includes 30 examples:

- 6 Nexus examples
- 6 Sentinel examples
- 6 Atlas examples
- 6 Source examples
- 6 Steward examples

Across the set, examples cover:

- Retail
- Healthcare
- Financial Services
- Cross-industry governance and handoff cases
- `lead-bullets`
- `lead-table`
- `stat-stack`
- `sequential-steps`
- `brief-narrative`

## Example Shape

Each example carries:

- agent
- surface
- question
- answer pattern
- retrieval plan
- ideal output

The retrieval plan is important. It trains the agent to retrieve tenant context, artifacts, patterns, KPI/value evidence, and missing-data signals before synthesis.

## Guardrails

Examples must not include:

- raw markdown emphasis in visible text
- raw bracketed pattern/use-case/vendor IDs in visible text
- unsupported KPI or financial claims
- broad generic consultant filler

Examples may include structured citation tags in ideal output. The visible label must be human-readable.

## Runtime Use

Prompt composition should pull only the examples relevant to the active agent, surface, and task shape. Do not inject all 30 examples into every turn.

Recommended default:

- 2 examples for routine chat turns
- 3 examples for high-value CXO demo surfaces
- 1 compact refusal or missing-data example when retrieval is sparse

