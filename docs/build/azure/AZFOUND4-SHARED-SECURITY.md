# AZFOUND4 - Shared Security Runbook

Resource Group: `rg-abarva-shared-security-lab-eastus`
Subscription: `abarva-lab-sub` (`701a8554-a166-46e9-bf13-743bc50e3b20`)
Region: `eastus`

## Resource Inventory (Key Vault, Defender, Policy Assignments)
- Key Vault: `kv-abarva-lab-001`
- Subscription-level Azure Policy assignments for baseline governance
- Defender for Cloud pricing/tier configuration (lab vs production path)
- Centralized security/audit logging routed to observability workspace

## Key Vault Hardening (Toggle Purge Protection ON for Production; Keep OFF for Lab with Explicit Rationale)
- Current lab state:
  - Soft delete: enabled
  - Purge protection: disabled
- Rationale for lab exception:
  - Faster teardown/rebuild cycles for synthetic-only environments
- Production requirement:
  - Purge protection must be enabled on all production Key Vault instances

## Secret Rotation Policy (Synthetic Secrets, 90-Day Rotation Discipline Even in Lab)
- Even synthetic secrets follow a 90-day rotation cadence.
- Rotation events are tracked in change logs.
- Real production secrets are prohibited in this subscription.

## RBAC Model (Who Reads What; Managed Identity from Control Plane = Read-Only Specific Secrets)
- Azure RBAC is the default model for vault access control.
- Control-plane managed identity receives read-only secret access for explicitly named secrets.
- Human access is role-scoped and least-privilege.
- Broad `Owner`/`Contributor` vault data-plane access is not allowed as a baseline.

## Azure Policy Assignments (Require Tags, Deny Public IPs in Data Plane, Require Diagnostic Settings)
- Baseline policy assignments include:
  - Required tags enforcement
  - Public IP restriction for private dataplane posture
  - Diagnostic settings enforcement pattern
- Where built-in definitions vary by tenant, the assignment IDs are parameterized in IaC.

## Defender for Cloud Tier (Free for Lab; Standard for Production Future)
- Lab baseline: free tier / minimal posture.
- Production target: Standard tiers per governed workload.
- Promotion to production tier requires cost and policy sign-off.

## Azure RBAC vs Vault Access Policy Decision (Default to RBAC for Consistency)
- Decision: use Azure RBAC as the primary authorization model.
- Reasoning: centralized role governance, consistent assignment workflow, better alignment with subscription policy controls.
- Access policy mode is not used as default in this lab starter.

## Bicep Template Path
- `infra/azure/shared-security.bicep`

## Pre-Deployment Checklist
- [ ] Confirm `kv-abarva-lab-001` naming and RG mapping.
- [ ] Confirm purge protection behavior (`false` in lab starter).
- [ ] Confirm policy definition IDs/initiative IDs for this tenant.
- [ ] Confirm synthetic-only policy is communicated to all operators.

## Post-Deployment Validation (Smoke Tests)
- [ ] Key Vault shows expected soft delete and purge protection settings.
- [ ] RBAC assignments are present for control-plane managed identity.
- [ ] Policy assignments show `Succeeded` provisioning state.
- [ ] Security/audit diagnostic routing lands in observability workspace.

## Rollback Procedure
1. Revert last policy assignment changes if they block valid lab operations unexpectedly.
2. Re-deploy prior known-good `shared-security.bicep` revision.
3. Validate Key Vault availability and role assignments after rollback.
4. Re-run policy compliance scan and capture exception rationale if needed.
