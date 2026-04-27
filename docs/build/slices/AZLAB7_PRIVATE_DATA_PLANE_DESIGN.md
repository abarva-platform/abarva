# Slice Report: AZLAB7 — Private Data Plane Design (Fortune 500)

Slice ID: AZLAB7
Title: Private Data Plane Design — How a Fortune 500 Runs AbarVa in Their Own Azure Subscription
Wave: wave-24
Track: 09-saas-azure-private-data-plane
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)
Type: Docs — no app runtime code, no migrations, no Azure deployment.

---

## Summary

Specifies the full design for how a Fortune 500 enterprise customer would run the AbarVa Private Data Plane inside their own Azure subscription. Covers the zero-standing-access model, boundary contract, evidence manifest schema, installation playbook, and ongoing operations.

## Files created

| File | Purpose |
|---|---|
| `docs/architecture/azure/AZLAB7-private-data-plane-design.md` | Full design document |

## Key design decisions documented

- AbarVa has zero standing access to customer subscription, data, or Key Vault
- Boundary endpoint is the only data exchange surface
- Evidence manifest contract: citation locators only, never raw bytes
- Boundary policy enforcer strips raw-data fields at the PDP before any response leaves
- Customer operates Key Vault; AbarVa never holds or has access to customer secrets
- Decommission: customer deletes resource group — AbarVa immediately loses all access

## Acceptance criteria met

- [x] Fortune 500 deployment architecture documented
- [x] Architecture diagram (Mermaid) included
- [x] AbarVa access model — zero standing access — specified
- [x] Evidence manifest contract JSON schema provided
- [x] Boundary policy enforcer rules specified
- [x] Installation playbook (5 steps) documented
- [x] FAQ section covering common enterprise concerns

## Excluded

- Container App image implementation (requires actual Node.js boundary service code — deferred)
- Customer-facing onboarding portal (deferred to later wave)
