# PROG13 · Deliverables by Phase + Evidence Trace Panel

**Wave**: wave-18
**Branch**: `wave18/prog13-deliverables-evidence-panel`
**Status**: code_complete
**Type**: program-ui

## Goal

Surface a deterministic visual panel that shows program deliverables grouped by canonical phase, annotated with version state, evidence state, missing inputs, and a one-line approval implication. Highlight the deliverable currently in focus.

## Files

- `src/lib/programs/program-deliverables-evidence-view.ts` — pure read model. `buildProgramDeliverablesEvidenceView({ programLabel? })` returns the deterministic view-model: 6 phase groups, 14 deliverables, evidence coverage percent, caveat, generatedAt.
- `src/components/programs/ProgramDeliverablesEvidencePanel.tsx` — `'use client'` React component. Renders header (eyebrow, title, stat chips, evidence coverage progress bar), 6 phase group sections, deliverable rows (label, version chip, version-state chip, evidence-state chip), expanded missing-inputs + approval implication on the current row, footer caveat.
- `src/__tests__/integration/programs/program-deliverables-evidence-panel.test.ts` — 16 tests covering shape, ordering, current-deliverable invariant, version/evidence state membership, caveat language, and a no-teal source check.

## Honesty posture

- No fake downloads. No fake approvals. No model-generated content claims. No model calls.
- Approval implication strings are advisory copy — the panel never flips an approval state.
- The "current deliverable" highlight is a deterministic seed marker; clicking a row does nothing by design.

## Design canon

- AbarVa surface `#FBFAF7`, card `#FFFFFF`, border `#E8E6E1`, ink `#0A0C12`, body `#1F2433`, muted `#525866`.
- Accent: `#1B2B5C` navy. No teal, no green, no purple, no neon.
- DM Sans body, JetBrains Mono for mono chips and eyebrows. Calm hierarchy, generous spacing.

## Validation

```bash
node_modules/.bin/tsc --noEmit --pretty false
node_modules/.bin/jest src/__tests__/integration/programs/program-deliverables-evidence-panel.test.ts --no-coverage
node_modules/.bin/eslint --max-warnings=0 \
  src/lib/programs/program-deliverables-evidence-view.ts \
  src/components/programs/ProgramDeliverablesEvidencePanel.tsx \
  src/__tests__/integration/programs/program-deliverables-evidence-panel.test.ts
```

## Deferrals

- No live persistence; the read model is composed in-memory at build time.
- No deliverable mutation, version transition, or approval workflow.
- No wiring into the canonical Programs detail surface — that mount lives in a follow-up slice.
