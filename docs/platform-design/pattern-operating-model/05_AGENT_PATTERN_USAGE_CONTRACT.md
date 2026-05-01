# Agent Pattern Usage Contract

## Purpose

Define how Nexus, Sentinel, Atlas, and Steward use patterns.

## Nexus

Nexus applies patterns to guide workflow and artifacts.

Nexus uses patterns to:

- Classify events and programs.
- Recommend next workflow action.
- Identify missing inputs.
- Shape artifacts and scorecards.
- Explain readiness.
- Surface negotiation and value levers.

## Sentinel

Sentinel validates evidence and pattern fit.

Sentinel uses patterns to:

- Match applicability signals.
- Detect anti-signals.
- Validate claims against evidence.
- Identify pattern mismatch.
- Flag failure modes.
- Confirm whether citations are sufficient.

## Atlas

Atlas synthesizes pattern implications for executives.

Atlas uses patterns to:

- Explain portfolio implications.
- Translate pattern risk into executive decision pressure.
- Summarize value/risk across work.
- Compare observed outcomes to baselines.

## Steward

Steward enforces pattern-derived gates and readiness rules.

Steward uses patterns to:

- Block unsafe workflow movement.
- Explain approval and evidence blockers.
- Identify readiness gaps.
- Enforce audit expectations.

## Citation Rules

An agent must cite a pattern when:

- The answer relies on pattern guidance.
- The answer recommends or blocks a workflow step due to pattern-derived rule.
- The answer shapes an artifact from a pattern section.
- The answer explains scorecard defaults, pricing levers, negotiation traps, or validation rules.

## Anti-Vanilla Rule

If an agent gives advice covered by an applicable pattern but does not use the pattern, the response is under-grounded.

## Pattern-Level vs Client-Specific Rule

Agents must distinguish:

- Pattern-level guidance: expert guidance from authored IP.
- Client-specific guidance: grounded in client/event/program evidence.

If evidence is thin, the agent can use pattern guidance but must label it as such.



## Category-Specific Retrieval Contract

Agent pattern usage must follow the category leverage table in `11_CORPUS_CATEGORY_LEVERAGE_TABLE.md` and the training playbook in `12_PATTERN_TO_VALUE_AND_AGENT_TRAINING_PLAYBOOK.md`.

Default emphasis by agent:

- Nexus: `pattern`, `deliverable-template`, `decision-framework`, contextual `industry-source-system`, and `evidence-template`.
- Sentinel: `industry-source-system`, `solution-architecture`, `vendor-implementation`, `regulatory-frame`, and `evidence-template`.
- Atlas: `pattern`, `solution-architecture`, `vendor-implementation`, and cross-program `anti-pattern` recurrence.
- Steward: `regulatory-frame`, `anti-pattern`, and `evidence-template`.

Hard rule: if client or program context exists, doctrine-only answers are under-grounded. Agents must retrieve from doctrine, industry, client, program, and run-state layers according to the context layer model in `13_CONTEXT_LAYER_AGENT_TRAINING_REPORT.md`.
