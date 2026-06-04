## T029 — Azure client tenant IaC

Status: Partial

Date: 2026-06-04

What was run

- `npm run azure:resource:parity`
- `npm run azure:client-tenant-iac:verify`
- `npx tsx scripts/tenant-bootstrap.ts --tenant apexretail --dry-run`
- Live Azure Container Apps connectivity job execution and logs
- `az bicep build --file infra/azure/client-tenant-foundation.bicep`
- `az deployment sub what-if --name client-tenant-lakeshore-whatif-20260604 --location eastus --template-file infra/azure/client-tenant-foundation.bicep --parameters infra/azure/parameters/lakeshore.pilot.bicepparam`

Evidence files

- `azure-resource-parity.txt`
- `azure-client-tenant-iac-verify.txt`
- `tenant-bootstrap-dry-apexretail.txt`
- `azure-connectivity-job-execution-list.json`
- `azure-connectivity-job-execution-show-current-final.json`
- `azure-connectivity-job-logs-current.txt`
- `client-tenant-lakeshore-whatif.txt`
- `lakeshore-namefix-deployment-show.json`
- `lakeshore-namefix-deployment-operations.json`
- `az-bicep-build-client-tenant-foundation.txt`

What passed

- Azure lab resource parity found the expected lab estate and current subscription scope.
- Client-tenant IaC scaffold verifier passed.
- Apex Retail tenant bootstrap dry-run passed.
- Live connectivity smoke succeeded inside the Azure Container Apps job context:
  - Postgres
  - Blob
  - Service Bus
  - Key Vault
  - Azure AI Search
- Subscription what-if produced a real Lakeshore pilot deployment plan, including:
  - client resource groups
  - private Postgres lane
  - immutable audit container
  - Defender-for-Storage settings

What needs attention

- `azure-resource-parity.txt` includes 9 `attention` findings for extra tracked lab resources not yet represented in the expected-resource manifest.
- The pre-existing subscription deployment `lakeshore-private-data-plane-namefix-20260604084514` is not a clean-slate client deploy proof. Inspection shows partial client-lane state plus two concrete failures:
  - missing VNet substrate for the Postgres private-peering deployment
  - immutable-audit management-policy rule invalid for append blobs

Why this is not Done

- This row still lacks a completed target-lane deploy transcript and rollback/deletion evidence for a client tenant, not just what-if.

Concrete remediation

- Treat the existing Lakeshore partial resource state as pre-existing evidence, not as fresh closure proof.
- For closure, run a controlled client-lane deployment against a known-good substrate, capture the deploy result, and capture the rollback/deletion posture in the same evidence packet.
