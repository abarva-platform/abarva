# Wave 24 — Azure Lab + SaaS + Private Data Plane

_Status: PLANNING | Blocked until: May 4, 2026 founder checkpoint_

---

## Wave Goal

Provision the AbarVa Azure lab and validate the private data plane architecture. This wave turns the Wave 12 IaC stubs (AZLAB1-5) into actual deployed infrastructure.

---

## Pre-Flight Dependencies

**HARD GATE**: Wave 24 cannot start until the May 4, 2026 founder planning checkpoint confirms:
1. Azure subscription ID for AbarVa lab (non-production)
2. Provider decision: Azure OpenAI vs Anthropic API
3. Search decision: pgvector (simpler) vs Azure AI Search (more capable)
4. Monthly cost ceiling confirmed ($200/month recommended for lab)
5. Region selection confirmed (East US 2 for lab)

---

## May 4 Checkpoint Checklist

| Item | Status | Owner |
|---|---|---|
| Azure subscription ID | Pending founder | Founder |
| Resource group naming approved | Pending | Founder |
| Monthly budget approved ($200/mo) | Pending | Founder |
| Provider decision (OpenAI vs Anthropic) | Pending | Founder |
| Search decision (pgvector vs Azure AI Search) | Pending | Founder |
| Region selection | Pending | Founder |

---

## Lanes

### LANE-A — AZLAB6: Azure Lab Provisioning Runbook

**Goal**: Create actual Terraform modules for the lab environment and verify they plan/apply correctly against the AbarVa Azure subscription.

**Files to create**:
- `infra/azure/modules/container-apps/main.tf`
- `infra/azure/modules/postgresql/main.tf`
- `infra/azure/modules/blob-storage/main.tf`
- `infra/azure/modules/key-vault/main.tf`
- `infra/azure/environments/lab/main.tf`
- `docs/build/slices/AZLAB6_AZURE_LAB_RUNBOOK.md`

**Acceptance criteria**:
- `terraform plan` runs without errors
- At least Container Apps + PostgreSQL deploy successfully
- Cost estimate confirmed under $200/month
- Runbook verified by founder

---

### LANE-B — AZLAB7: Azure Private Evidence Manifest Integration

**Goal**: Wire the evidence manifest API to Azure Blob Storage for the private data plane demo.

**Files to create**:
- `lib/azure/evidence-manifest-client.ts`
- `lib/azure/private-data-plane-config.ts`
- `app/api/tenant/[tenantSlug]/evidence/manifest/route.ts`
- `docs/build/slices/AZLAB7_AZURE_EVIDENCE_MANIFEST.md`

**Acceptance criteria**:
- Evidence manifest entries show Azure Blob Storage references
- Trust level enforcement: agent-usable required for evidence access
- No document content in manifest (manifest-ref only)

---

### LANE-C — AZLAB8: Cost Monitoring + Alerting

**Goal**: Configure Azure cost alerts so the lab does not exceed budget.

**Files to create**:
- `infra/azure/modules/monitoring/budget-alert.tf`
- `docs/build/slices/AZLAB8_COST_MONITORING.md`

**Alert thresholds**:
- $150/month: warning notification
- $200/month: hard ceiling — auto-scale down

---

### LANE-D — TEN4: Dedicated Tenant Blueprint Update

**Goal**: Update the dedicated tenant blueprint (TEN2) to reflect actual Azure architecture decisions from May 4 checkpoint.

**Files to modify**:
- `docs/backlog/tracks/09-saas-azure-private-data-plane/BACKLOG.md` — Update with May 4 decisions
- `docs/build/slices/TEN4_DEDICATED_TENANT_AZURE_UPDATE.md`

---

## Conflicts to Watch

- LANE-A and LANE-B may both touch `infra/azure/` — coordinate module structure before starting
- Provider decision (Azure OpenAI vs Anthropic) must be made before LANE-B can implement the model gateway connection

---

## Acceptance Criteria

- [ ] May 4 checkpoint decisions documented
- [ ] Terraform plan runs without errors against AbarVa lab subscription
- [ ] Container Apps + PostgreSQL deployed and verified
- [ ] Cost alert configured at $150/$200 thresholds
- [ ] Evidence manifest API shows Azure Blob references for at least 1 demo document
- [ ] No customer data in AbarVa cloud (private data plane validation)
- [ ] Cost confirmed under $200/month
