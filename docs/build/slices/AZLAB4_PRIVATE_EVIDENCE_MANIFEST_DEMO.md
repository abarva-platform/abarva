# AZLAB4 — Private Evidence Manifest Demo

## ID
AZLAB4

## Goal
Demonstrate how AbarVa handles client evidence when raw source data is retained exclusively within the client's private data plane. This slice creates a deterministic, file-pure read model that illustrates structured evidence manifests across six or more business domains, encoding the no-raw-copy guarantee and simulated governance approval states.

## Status
code_complete

## Date
2026-04-26

## Files

### Source
- `src/lib/architecture/private-evidence-manifest-demo.ts`

### Tests
- `src/__tests__/integration/architecture/private-evidence-manifest-demo.test.ts`

## Contract

### Types exported
- `ApprovalState` — `'approved' | 'pending' | 'rejected' | 'simulated'`
- `EvidenceUsability` — `'usable' | 'partial' | 'not_usable' | 'deferred'`
- `PrivateEvidenceManifestEntry` — single manifest row; `rawDataRetainedByClient: true`, `noRawCopyConfirmed: true`, `simulatedApproval: true` are literal type-level guarantees
- `PrivateEvidenceManifestDemo` — manifest envelope with `deterministicOnly: true`, `isSimulatedDemo: true`

### Builder exported
- `buildPrivateEvidenceManifestDemo(): PrivateEvidenceManifestDemo`

### Business domains covered (8 entries)
1. HR Analytics — Workday HCM attrition rate (GDPR, confidential, EU data residency)
2. Sales Data — Salesforce Sales Cloud pipeline value (competitive sensitivity)
3. Financial Metrics — Oracle Fusion ERP AI programme OpEx (SOX, restricted)
4. Supply Chain — SAP S/4HANA on-time delivery rate (operational sensitivity)
5. Customer Data — Qualtrics NPS score (GDPR, CCPA, pseudonymised PII)
6. IT Telemetry — Datadog APM inference service P95 latency (no PII)
7. Contact Centre Operations — Genesys Cloud CX average handle time (agent PII pseudonymised)
8. Risk & Compliance — ServiceNow GRC AI incident log (EU AI Act, legal hold)

## Structural guarantees
- `rawDataRetainedByClient: true` is a literal on all 8 entries — never computed
- `noRawCopyConfirmed: true` is a literal on all 8 entries
- `simulatedApproval: true` is a literal on all 8 entries
- `noRawCopyCaveat` states raw data stays in client's private data plane, AbarVa holds manifests only
- `simulationCaveat` explicitly marks all approval states and locators as illustrative
- `citationLocatorPlaceholder` on every entry references the entryId and the Private Data Plane API
- `governanceFlags` is a non-empty array on every entry
- `generatedAt` is `2026-04-26`
- Two calls to `buildPrivateEvidenceManifestDemo()` return byte-identical manifests (deterministic)

## Production readiness note
No live evidence ledger binding, no DB persistence, no model invocation. This is a demo-only read model. The future Steward UI and Azure Private Data Plane runtime will consume this shape without changing the AZLAB4 contract. `data_evidence_knowledge_fabric` status is not promoted by this slice.
