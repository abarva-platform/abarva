# Moves E2E Operating Smoke Test

Run started: 2026-09-23T22:26:29Z

Branch/SHA: smoke report opened on `codex/moves-e2e-operating-smoke` at `7e74fe7a055f110685a24d65b10d9a11468f16aa`; latest shipped fix verified on `origin/main` at `d86f4c6ccb540c4c1a8311b9f2ec537ce9217adc`.

Scope: full Moves operating smoke test across P0-P5 using synthetic healthcare evidence only.

Current status: smoke pass completed through shipped fixes and live proof. Remaining gaps are listed separately; this report does not claim every stale generated artifact has been regenerated.

## Executive Status

| Area                 | Status      | Notes                                                                                                         |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| P0-P5 workflow       | Complete for live readback | Phase rail and page text show P0-P5 complete, with P5 handed off to Tower.                                    |
| Upload/parse/state   | Partial                   | Existing evidence and File Cabinet state were read; a fresh upload/parse/write mutation pass was not rerun.   |
| aVa guidance         | Complete for P5           | P5 evidence/gate visibility and terminal execution handoff guidance fixed and browser-proven.                 |
| Gates/approvals      | Complete for terminal P5  | Terminal P5 gate status and Tower handoff labels fixed and browser-proven.                                    |
| Artifact quality     | Complete for sampled corpus | DOCX/PPTX/XLSX artifacts inspected; stale artifacts needing regeneration remain listed as follow-up.          |
| Office exports       | Complete for inspected artifacts | DOCX/PPTX/XLSX outputs were opened/scanned/rendered where available.                                    |
| Deploy/runtime proof | Complete                  | Fourteen Moves smoke fixes shipped through ACA; latest verified by runtime invariant and signed-in browser proof. |

## Current Finding Summary

| ID            | Severity   | Summary                                                                                                                                                           | Status                                                                                               |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| MOVES-E2E-001 | P1 serious | Adaptive discovery blueprint routing over-selected contact-center agent-assist requirements for broad healthcare wording.                                         | Merged/deployed; browser proof not required for rule-only resolver change.                           |
| MOVES-E2E-002 | P1 serious | Terminal P5 handoff page showed complete/handoff evidence while still labelling the next step as `Run Approve & Build` / `Open`.                                  | Merged/deployed/browser-proven.                                                                      |
| MOVES-E2E-003 | P1 serious | P5 aVa guidance could call evidence notes required before acceptance after terminal handoff was already complete.                                                 | Superseded by MOVES-E2E-008/009 findings; latest #8390 fixed embedded phase aVa evidence visibility. |
| MOVES-E2E-009 | P1 serious | Embedded phase aVa did not receive the context-extract evidence count, so it answered from `0 evidence items visible` even when the File Cabinet showed evidence. | Merged/deployed/browser-proven via #8390.                                                            |
| MOVES-E2E-010 | P2 quality | P5 aVa needed execution-readiness handoff guidance, not only phase-readiness scorecard furniture.                                                                 | Merged/deployed/browser-proven via #8392.                                                            |
| MOVES-E2E-011 | P2 quality | File Cabinet summary overstated generated deliverables as final-ready rather than review-ready exports.                                                           | Merged/deployed/browser-proven via #8396/#8402/#8404.                                                |
| MOVES-E2E-012 | P1 serious | A generated DOCX exported raw render-package payload into the document body, and the readiness scanner did not block it.                                         | Merged/deployed; scanner guard proven against extracted live artifact text via #8401.                 |
| MOVES-E2E-013 | P2 quality | PPTX exports carried dense document prose and weak slide visuals.                                                                                                | Density guard merged/deployed via #8403; stronger diagram quality remains open.                      |
| MOVES-E2E-014 | P2 quality | Uploaded aggregate evidence/control packets inflated generated-export counts.                                                                                    | Merged/deployed/browser-proven via #8404.                                                            |
| MOVES-E2E-015 | P3 polish  | File Cabinet summary used plural grammar for one review item (`1 deliverable need review`).                                                                     | Merged/deployed/browser-proven via #8407.                                                            |
