## T195 — Small PDF native handoff

Status: Partial

Date: 2026-06-04

What was run

- `npx jest src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts --runInBand`

Evidence files

- `jest-agent-route-context-bundle.txt`

What passed

- Agent route context-bundle tests passed.
- The repo contract for small-document/native-PDF routing is exercised and green.

Why this is not Done

- Missing closure items are live environment proof:
  - authenticated Azure/object-storage retrieval of the PDF
  - live threshold proof against stored bytes/pages
  - Anthropic native-document request proof
  - cost/latency comparison packet

Concrete remediation

- Drive one authenticated small-PDF upload through the live agent route with Anthropic enabled, capture the sanitized native-document payload shape and the returned cost/latency data.
