## T186 — Parser fallback

Status: Partial

Date: 2026-06-04

What was run

- `npx jest src/lib/ingestion/__tests__/parser-fallback-policy.test.ts src/lib/ingestion/__tests__/parser-fallback-runtime.test.ts --runInBand`
- Inline runtime harness for a non-sensitive, consented third-party fallback path

Evidence files

- `jest-parser-fallback.txt`
- `parser-fallback-harness.json`

What passed

- Parser fallback policy and runtime tests passed.
- Runtime harness produced:
  - fallback decision
  - fallback invocation
  - fallback result
  - commit blocked pending human review
- The harness shows ledger-shaped events and explicit customer consent gating.

Why this is not Done

- Ledger output here is in-memory harness output, not persisted production evidence.
- Missing closure items:
  - real Marker deployment proof
  - approved LlamaParse live path with third-party consent
  - persisted fallback ledger rows
  - end-to-end fallback run against a real document

Concrete remediation

- Run one real fallback document through the live pipeline with durable ledger persistence and capture both the parser choice and the persisted result rows.
