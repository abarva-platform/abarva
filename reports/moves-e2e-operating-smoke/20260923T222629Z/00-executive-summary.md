# Moves E2E Operating Smoke Test

Run started: 2026-09-23T22:26:29Z

Branch/SHA: `codex/moves-e2e-operating-smoke` at `7e74fe7a055f110685a24d65b10d9a11468f16aa`

Scope: full Moves operating smoke test across P0-P5 using synthetic healthcare evidence only.

Current status: in progress.

## Executive Status

| Area                 | Status      | Notes                                                                |
| -------------------- | ----------- | -------------------------------------------------------------------- |
| P0-P5 workflow       | In progress | Baseline inventory and safe read-only audits running first.          |
| Upload/parse/state   | In progress | Will validate parsed content and persisted state, not metadata only. |
| aVa guidance         | In progress | Will test guidance, draft behavior, citations, and no silent writes. |
| Gates/approvals      | In progress | Will validate completion vs gate status and self-approval policy.    |
| Artifact quality     | In progress | Will score each artifact against client-deliverable criteria.        |
| Office exports       | In progress | Will inspect DOCX/PPTX/XLSX outputs where generated.                 |
| Deploy/runtime proof | Not started | Only needed after fixes merge.                                       |

## Current Finding Summary

| ID            | Severity   | Summary                                                                                                                   | Status                            |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| MOVES-E2E-001 | P1 serious | Adaptive discovery blueprint routing over-selected contact-center agent-assist requirements for broad healthcare wording. | Fixed locally; PR/deploy pending. |
