# Moves E2E Operating Smoke Test

Run started: 2026-09-23T22:26:29Z

Branch/SHA: smoke report opened on `codex/moves-e2e-operating-smoke` at `7e74fe7a055f110685a24d65b10d9a11468f16aa`; latest shipped fix verified on `origin/main` at `7b9d5a9d47a875c97f95bda998734e7c50ec98b1`.

Scope: full Moves operating smoke test across P0-P5 using synthetic healthcare evidence only.

Current status: in progress.

## Executive Status

| Area                 | Status      | Notes                                                                                                         |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| P0-P5 workflow       | In progress | Baseline inventory complete; terminal P5 handoff status fixed, merged, deployed, and browser-proven.          |
| Upload/parse/state   | In progress | Will validate parsed content and persisted state, not metadata only.                                          |
| aVa guidance         | In progress | P5 evidence/gate visibility and terminal execution handoff guidance fixed and browser-proven.                 |
| Gates/approvals      | In progress | Will validate completion vs gate status and self-approval policy.                                             |
| Artifact quality     | In progress | Will score each artifact against client-deliverable criteria.                                                 |
| Office exports       | In progress | Will inspect DOCX/PPTX/XLSX outputs where generated.                                                          |
| Deploy/runtime proof | In progress | Nine Moves smoke fixes shipped through ACA; latest verified by runtime invariant and signed-in browser proof. |

## Current Finding Summary

| ID            | Severity   | Summary                                                                                                                                                           | Status                                                                                               |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| MOVES-E2E-001 | P1 serious | Adaptive discovery blueprint routing over-selected contact-center agent-assist requirements for broad healthcare wording.                                         | Merged/deployed; browser proof not required for rule-only resolver change.                           |
| MOVES-E2E-002 | P1 serious | Terminal P5 handoff page showed complete/handoff evidence while still labelling the next step as `Run Approve & Build` / `Open`.                                  | Merged/deployed/browser-proven.                                                                      |
| MOVES-E2E-003 | P1 serious | P5 aVa guidance could call evidence notes required before acceptance after terminal handoff was already complete.                                                 | Superseded by MOVES-E2E-008/009 findings; latest #8390 fixed embedded phase aVa evidence visibility. |
| MOVES-E2E-009 | P1 serious | Embedded phase aVa did not receive the context-extract evidence count, so it answered from `0 evidence items visible` even when the File Cabinet showed evidence. | Merged/deployed/browser-proven via #8390.                                                            |
| MOVES-E2E-010 | P2 quality | P5 aVa needed execution-readiness handoff guidance, not only phase-readiness scorecard furniture.                                                                 | Merged/deployed/browser-proven via #8392.                                                            |
