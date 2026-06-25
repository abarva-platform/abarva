# Home Claude Text Output Contract

## Contract

Claude returns plain text only.

Expected shape:

1. Executive answer paragraph.
2. Current-state synthesis paragraph.
3. Business implication paragraph.
4. Specific gaps / safe answer boundary paragraph.
5. Optional handoff paragraph if the user asks for advisory judgment.

Claude must not return UI JSON, tables, charts, graphs, source objects, route names, or internal debug labels.

## What AbarVa Owns

AbarVa owns:

- question classification
- dimension dossier assembly
- rollups and metrics
- deterministic artifacts
- citations
- gaps
- safe answer boundary
- validation
- rendering
- fallback

Claude owns:

- consultant-grade prose phrasing from the supplied dossier

## Validation

Text validation checks:

- non-empty text
- no false refusal when the dossier has partial evidence
- no raw IDs
- no internal labels or table names
- no "I found"
- no "Read", "Evidence", "Evidence points", or "Current-state read" lead
- no unsupported Home recommendation
- no cross-tenant leakage
- no "cannot be characterized" when partial evidence exists

Claude does not need to embed citation IDs in every sentence. AbarVa attaches deterministic citations and artifacts under the answer.

## Runtime Settings

Defaults:

- `HOME_KNOW_CLAUDE_OUTPUT_MODE=text`
- `HOME_KNOW_CLAUDE_MAX_TOKENS=25000`
- `HOME_KNOW_CLAUDE_TIMEOUT_MS=60000`
- default model: `claude-opus-4-8`

The production path must use `getAuditedAnthropicClient`; unmanaged raw Anthropic calls are not allowed.

