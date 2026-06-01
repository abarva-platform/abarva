# Pilot Private Data Plane Security and Retention Policy

Date: 2026-06-01

Rows covered: T361-T364

This policy is the execution authority for the second pilot private data-plane
security slice. It binds malware scanning, encryption/key posture,
retention/deletion, and audit export behavior to the durable ingestion ledger
added in T357-T360.

## Malware Gate

No private pilot file may be parsed, indexed, or promoted out of the landing
container until the malware gate returns `clean`. `pending`, `scan_failed`, and
`infected` all block parsing and storage promotion. PHI/PII scanning remains a
separate guard: a file with clean malware status but quarantined sensitive-data
status can only remain as a quarantine artifact until released or rejected.

Runtime contract: `evaluatePilotMalwareGate` in
`src/lib/admin/pilot-data-plane-security-policy.ts`.

## Encryption And Key Policy

For live regulated pilot data, the private data plane requires
`customer_managed_key` or `bring_your_own_key` mode. Platform-managed
encryption is acceptable only for synthetic, de-identified, or rehearsal data
where the customer contract explicitly allows it.

Minimum live-file posture:

- Key Vault private endpoint enabled.
- Key Vault purge protection enabled.
- Key or secret rotation scheduled between 1 and 180 days.
- CMK/BYOK decision recorded in the pilot setup evidence packet.
- Storage, queue, search, and database resources remain private-endpoint scoped.

Runtime contract: `validatePilotEncryptionPosture` in
`src/lib/admin/pilot-data-plane-security-policy.ts`.

## Retention And Deletion

| Artifact class | Retention | Deletion trigger | Approval |
| --- | ---: | --- | --- |
| Raw upload | 30 days | Delete after commit, rejection, or customer offboarding hold expires. | Required |
| Quarantine copy | 30 days | Delete after release, rejection, hard-delete, or approved exception. | Required |
| Parsed intermediate | 14 days | Delete after preview approval, rejection, or rollback replay completion. | Not required |
| Failed load | 30 days | Delete after failure triage and audit export capture. | Required |
| Committed evidence | 2555 days | Retain through audit window unless customer contract is longer. | Required |
| Audit export | 2555 days | Retain through audit window; signed links expire within 24 hours. | Required |
| Offboarding export | 30 days | Delete after customer confirms receipt or offboarding window expires. | Required |

Runtime contract: `PILOT_RETENTION_POLICIES` and `getPilotRetentionPolicy`.

## Audit Export

Audit exports must be tenant-scoped and generated from ledger tables, not from
ad hoc storage listing. Upload-run exports include upload runs, file manifests,
quarantine cases, clarification requests, approval decisions, and export
manifests. Load-commit exports also include load commits, commit items, and
rollback requests.

Access links must expire within 24 hours. The export record must include
tenant key, requester, export scope, storage path, and SHA-256 hash.

Runtime contract: `buildPilotAuditExportManifest`; persistence target:
`pilot_ingestion_audit_exports`.

## Follow-On Wiring

This slice defines and tests the policy contract. Follow-on implementation
should wire the contract into:

- landing-zone worker malware scan step before parsing,
- Setup Data Load Center status rendering,
- audit-export API/action,
- retention sweeper or Azure lifecycle rules,
- tenant isolation smoke for Apex Retail, Meridian Health, and SkyHarbor Air.
