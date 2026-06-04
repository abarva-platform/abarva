## T199 — Raw-mode escape hatch

Status: Partial

Date: 2026-06-04

What was run

- `npx jest src/components/agent/__tests__/AgentDock.test.tsx src/lib/agent/__tests__/attachments.test.ts --runInBand`

Evidence files

- `jest-raw-mode-contracts.txt`

What passed

- Raw-mode UI and attachment-contract tests passed.
- The current code proves:
  - explicit raw-mode acknowledgement is required
  - acknowledgement metadata is forwarded
  - warning/cost contract is exercised in tests

Why this is not Done

- Missing closure items are live end-to-end proof:
  - stored PDF retrieval
  - Anthropic native-document call
  - visible cost warning in the live app flow
  - uncommitted review result proof from the target environment

Concrete remediation

- Run one live raw-mode PDF through the authenticated agent flow, capture the warning surface, sanitized native-document request shape, and the review result without committing downstream changes.
