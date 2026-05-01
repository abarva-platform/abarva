# AbarVa Pattern Operating Model Anchor

## Purpose

This folder is the source of truth for how AbarVa patterns work across Source, Programs, Intelligence, Control Tower, and Admin/Setup.

Patterns are not just markdown documents. Patterns are authored IP that can become:

- Agent guidance.
- Artifact templates.
- Validation rules.
- Product logic.
- Benchmark baselines.
- Negotiation playbooks.
- Failure-mode guardrails.
- Learning loops.

## Operating Principle

Agents must use patterns through structured context, not loose retrieval. A pattern should be auditable, citeable, versioned, and scoped to the user's surface, workflow stage, intent, and evidence state.

## Read Order

1. `00_PATTERN_OPERATING_MODEL_ANCHOR.md`
2. `01_PATTERN_TAXONOMY.md`
3. `02_PATTERN_AUTHORING_STANDARD.md`
4. `03_PATTERN_STORAGE_AND_MANIFEST_MODEL.md`
5. `04_PATTERN_RETRIEVAL_AND_CONTEXT_ASSEMBLY.md`
6. `05_AGENT_PATTERN_USAGE_CONTRACT.md`
7. `06_PATTERN_TO_ARTIFACT_MODEL.md`
8. `07_PATTERN_TO_VALIDATION_MODEL.md`
9. `08_PATTERN_TO_PRODUCT_LOGIC_MODEL.md`
10. `09_PATTERN_LEARNING_AND_FEEDBACK_LOOP.md`
11. `10_SOURCE_OUTSOURCING_PATTERN_PACK_STANDARD.md`
12. `11_CORPUS_CATEGORY_LEVERAGE_TABLE.md`
13. `12_PATTERN_TO_VALUE_AND_AGENT_TRAINING_PLAYBOOK.md`
14. `13_CONTEXT_LAYER_AGENT_TRAINING_REPORT.md`

## Pattern Usage Standard

Every agent-facing pattern use should answer:

- Which pattern was used?
- Which section was used?
- Why was it applicable?
- What evidence or signals matched?
- What context is still missing?
- Whether the output is pattern-level guidance or client-specific guidance.

## Auditability

Pattern usage should be traceable from response, artifact, validation result, or product gate back to pattern id, version, section, evidence, and context bundle.

## Boundary

This model is specification only. It does not implement pattern ingestion, manifest generation, vector retrieval, graph retrieval, model calls, or runtime gates.


## Category-to-Value Extension

The operating model now includes a category-to-value and agent-training layer:

- `11_CORPUS_CATEGORY_LEVERAGE_TABLE.md` defines how each corpus category should be used by Nexus, Sentinel, Atlas, and Steward.
- `12_PATTERN_TO_VALUE_AND_AGENT_TRAINING_PLAYBOOK.md` defines how pattern categories convert into measurable client value and evaluator behavior.
- `13_CONTEXT_LAYER_AGENT_TRAINING_REPORT.md` defines the five-layer context model, expansion targets, and training/evaluation cadence.

These documents are canonical for context-pack design, agent retrieval policy, and future evaluator fixtures.
