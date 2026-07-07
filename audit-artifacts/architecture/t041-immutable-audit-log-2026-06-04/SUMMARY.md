## T041 — Immutable audit log

Status: Partial

Date: 2026-06-04

What was run

- `npm run azure:immutable-audit-log:verify`
- `npm run azure:security:audit`
- `npm run azure:observability:audit`
- `npx tsx src/scripts/assert-sensitive-upload-audit-immutability.ts`
- Azure storage control-plane inspection
- Lakeshore client-tenant what-if review for immutable audit resources

Evidence files

- `azure-immutable-audit-log-verify.txt`
- `azure-security-audit.txt`
- `azure-observability-audit.txt`
- `assert-sensitive-upload-audit-immutability.txt`
- `storage-account-show.json`
- `storage-management-policy.json`
- `../t029-client-tenant-iac-2026-06-04/client-tenant-lakeshore-whatif.txt`

What passed

- Immutable-audit-log readiness verifier passed.
- Azure observability audit passed.
- App-layer audit immutability assertion passed:
  - authenticated observer and tenant_admin updates were blocked
  - authenticated observer and tenant_admin deletes were blocked
  - lifecycle rows appended without mutating the original record
- Lakeshore what-if includes:
  - `audit-ledger` container creation
  - version-level immutability enabled
  - protected append writes enabled
  - `365` day immutability policy
  - lifecycle management policy for audit blobs

Important live findings

- Live security audit failed on one unrelated issue: `TENANT_KEY` is still a literal env var on `job-skyharbor-load-0528`.
- Live storage account inspection shows `publicNetworkAccess: Disabled` and `defaultAction: Deny`, which is correct for fail-closed access.
- Direct storage data-plane reads from this laptop were blocked by storage network rules, which is expected outside the private lane.
- Inspection of the pre-existing subscription deployment `lakeshore-private-data-plane-namefix-20260604084514` shows a real immutable-audit deployment failure:
  - `InvalidManagementPolicyRule`
  - append blobs do not support the attempted tiering action in rule `immutable-audit-ledger-cool-tier`

Why this is not Done

- This row still lacks closure-grade live private-lane WORM proof on the actual `audit-ledger` container:
  - sample append in-lane
  - denied overwrite/delete in-lane
  - direct retention/property read from the deployed audit container

Concrete remediation

- Run the append and denied overwrite/delete probe from inside the private Azure execution context that can reach the storage data plane, and capture the exact container-level retention/immutability response.
