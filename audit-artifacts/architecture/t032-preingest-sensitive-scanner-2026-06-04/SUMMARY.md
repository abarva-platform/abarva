## T032 — Pre-ingest sensitive scanner

Status: Partial

Date: 2026-06-04

What was run

- `npx jest src/lib/security/__tests__/preingest-sensitive-scanner.test.ts src/lib/security/__tests__/sensitive-upload-guard.test.ts --runInBand`
- Inline scanner sample harness for clean, fake-SSN, and fake-card text

Evidence files

- `jest-preingest-sensitive-scanner.txt`
- `scanner-samples.json`

What passed

- Scanner and upload-guard tests passed.
- Clean sample passed without findings.
- Synthetic SSN sample was flagged and quarantined.
- Synthetic card sample was flagged and quarantined.

Why this is not Done

- This is still repo/runtime-contract evidence, not live adapter proof.
- Missing closure items:
  - live Presidio/Azure DLP/Purview adapter proof
  - OCR-sensitive sample proof where OCR matters
  - live quarantine table/ledger proof
  - end-to-end upload quarantine evidence

Concrete remediation

- Drive a real upload through the live ingestion path with quarantine storage/ledger capture, and wire the scanner adapter used in the target environment.
