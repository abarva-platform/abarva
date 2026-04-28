# PROD11 — Pilot Tenant Setup Runbook

**Slice ID:** PROD11  
**Wave:** wave-26  
**Track:** 06 — Production + Pilot Hardening  
**Status:** code_complete  
**Completed:** 2026-04-26  
**Author:** AbarVa Autonomous Orchestration  
**Type:** Documentation — docs only, no runtime code, no migrations, no model calls.

---

## What was built

**`docs/pilot/TENANT_SETUP_RUNBOOK.md`** — Step-by-step operational runbook for setting up a new enterprise pilot tenant in 5 business days.

### Runbook covers

1. **Pre-flight checklist** — data sharing agreement confirmation, tier selection (T1/T2/T3), data tier (L0–L4)
2. **Step 1: Create tenant in Postgres** — SQL insert with schema reference, verification query
3. **Step 2: Configure Clerk org and user roles** — Clerk dashboard steps, org-to-tenant mapping
4. **Step 3: Seed initial programme data** — data gathering template, insert script pattern, seed verification
5. **Step 4: Azure private data plane** (Tier 3 clients only) — references AZLAB7 runbook
6. **Step 5: Route verification** — 16-route smoke test for new tenant
7. **Step 6: Send credentials securely** — secure channel guidance, email template
8. **Step 7: Schedule onboarding call** — 30-min agenda, pre-read materials
9. **Summary checklist** — all steps with owner + day + done checkbox
10. **Known gaps** — 4 documented gaps with remediation targets

---

## Files created

- `docs/pilot/TENANT_SETUP_RUNBOOK.md`
- `docs/build/slices/PROD11_TENANT_SETUP_RUNBOOK.md` (this file)

---

## Excluded

- No Clerk configuration changes
- No database schema changes (gaps documented; flagged for Wave 27)
- No API routes modified
- No production environment variables
- No `db:migrate` or `db:seed` calls
