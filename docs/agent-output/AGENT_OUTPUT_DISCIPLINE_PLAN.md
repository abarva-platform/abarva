# Agent Output Discipline Plan

Version: 2026-05-09

## Goal

Make Nexus, Sentinel, Atlas, Source, and Steward consistently produce CXO-grade answers that are:

- scannable in five seconds
- browsable in thirty seconds
- deeply readable in two minutes when the user chooses to go deeper

## Failure Modes Covered

1. Raw markdown leaks: `**bold**`, `*italic*`, or code fences shown to users.
2. Raw corpus IDs: IDs like `P-HC-005` appearing as visible text instead of human-readable citations.
3. Meandering output: long discursive answers that lose the reference, recommendation, or next action.

## Execution Layers

### Layer 1: Output Contract

Create and version the locked specification in `docs/agent-output/AGENT_OUTPUT_CONTRACT.md`.

Gate: every prompt, renderer, validator, and golden test references the same five answer shapes.

### Layer 2: Golden Eval Harness

Create a broad, deterministic test set before changing more runtime.

Minimum baseline:
- 60 or more prompts
- all five agents
- all five answer shapes
- retail, healthcare, financial services, and cross-industry cases
- good answers and violation detection

### Layer 3: System Prompt Architecture

Move each agent toward a composed prompt structure:

1. role
2. context hierarchy
3. tools
4. output contract
5. citations
6. few-shot examples
7. lane discipline

### Layer 4: Few-Shot Training Library

Add 5-7 examples per agent showing:

- user question
- retrieval intent
- selected answer pattern
- final output
- "I do not know" behavior
- handoff behavior

### Layer 5: Citation Rendering

Render custom tags as React components:

- `<abv-pattern>`
- `<abv-usecase>`
- `<abv-vendor>`
- `<abv-sources>`

The UI should show human names by default and expose IDs, sources, and reliability on hover/tap or side panel.

### Layer 6: Validation and Repair

Before display:

- parse structured output
- validate pattern and limits
- strip safe markdown violations
- repair raw IDs when mapping exists
- ask for one reformat retry on structural violations
- log unresolved violations

### Layer 7: Continuous Quality Monitoring

Log:

- selected answer shape
- length
- citation count
- validation violations
- repair/retry count
- agent/surface
- sample prompts and scored outputs

## PR Sequence

1. Contract and golden eval harness.
2. Shared prompt contract and prompt tests.
3. Few-shot libraries for Nexus, Sentinel, Atlas.
4. Few-shot libraries for Source and Steward.
5. Citation parser and React rendering components.
6. Output validation and repair middleware.
7. Browser E2E across all agent surfaces.
8. Quality logging and weekly report.

## Completion Criteria

The program is complete when:

- golden eval has at least 60 prompts and passes
- every agent prompt includes the shared output contract
- browser tests prove raw markdown and raw IDs do not render
- citations render as human-readable components
- output validation repairs or retries violations
- quality metrics are logged and reviewable

