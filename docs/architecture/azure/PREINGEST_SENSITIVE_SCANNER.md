# Pre-Ingest Sensitive Scanner

## Purpose

Backlog row T032 requires PHI/PII scanning before parsing, indexing, graph
extraction, or evidence-ledger use. This document records the current scanner
contract and the path to Microsoft Presidio deployment.

## Current Contract

`src/lib/security/preingest-sensitive-scanner.ts` provides a deterministic
first-pass scanner for high-confidence identifiers:

- US SSN;
- medical record / patient / member identifiers;
- DOB labels with dates;
- bank routing and account labels;
- Luhn-valid payment card numbers;
- email addresses;
- US phone numbers.

High-severity findings require quarantine. Medium-severity business contact
findings are flagged, but do not force quarantine by themselves.

The existing `src/lib/security/sensitive-upload-guard.ts` calls this scanner
before any upload can be stored, indexed, or used for evidence extraction.

## Presidio Compatibility

The scanner emits Presidio-style entity names such as `US_SSN`,
`DATE_OF_BIRTH`, `MEDICAL_RECORD_NUMBER`, `CREDIT_CARD`, `EMAIL_ADDRESS`, and
`PHONE_NUMBER`. This lets the future Microsoft Presidio service adapter merge
NER findings into the same enforcement and audit path instead of introducing a
separate policy vocabulary.

## Quarantine Rule

Uploads must be quarantined when:

- the user declares the upload as regulated PHI/PII;
- the scanner finds any high-severity identifier;
- Microsoft Defender for Storage reports malware, not scanned, error, or
  unknown scan state;
- template or metadata validation blocks safe parsing.

Quarantined files must not be parsed, indexed, embedded, added to the graph,
used by agents, or committed to deliverables until a human review path releases
them under the private data-plane policy.

## Current Gaps

This repo slice does not run the Microsoft Presidio Python service, does not
perform OCR over image/PDF bytes, and does not add new quarantine table
migrations. It strengthens the pre-ingest scanner contract and keeps the
existing guard behavior stable. T032 remains in progress until a live Presidio
service or equivalent Azure DLP/Purview adapter is wired and proven end to end.
