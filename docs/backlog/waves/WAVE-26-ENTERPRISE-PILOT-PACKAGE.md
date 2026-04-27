# Wave 26 — Enterprise Pilot Package

_Status: PLANNING | Estimated wave date: June 2026_

---

## Wave Goal

Produce the complete package for an enterprise pilot client: security posture documentation, pilot tenant setup runbook, client onboarding materials, demo scripts for enterprise stakeholders, and investor materials.

---

## Pre-Flight Dependencies

- Wave 24 merged (Azure lab provisioned)
- Wave 25 merged (QA30-32 suites pass, no-fabrication verified)
- Founder decision: who is the first pilot client? (Determines scope of runbook)

---

## Lanes

### LANE-A — PROD10: Pilot Security Posture Documentation

**Goal**: Self-assessment security posture document for Fortune 500 enterprise pilot clients' security review teams.

**Files to create**:
- `docs/pilot/SECURITY_POSTURE.md` — Public-facing security overview
- `docs/pilot/SECURITY_CONTROLS_MATRIX.md` — ISO 27001 / SOC2 reference controls matrix
- `docs/build/slices/PROD10_PILOT_SECURITY_POSTURE.md`

**Key sections**:
1. Authentication and access control (Clerk + RLS + role model)
2. Data encryption at rest and in transit
3. Data residency (US-only currently; EU via Azure future)
4. Audit logging retention
5. Backup and DR (document gaps honestly)
6. Known gaps and remediation timeline
7. Azure private data plane option (Tier 3)

**Honesty rule**: All known gaps must be documented. Do NOT claim SOC2 compliance. Do NOT claim pen-testing has been done if it hasn't.

---

### LANE-B — PROD11: Pilot Tenant Setup Runbook

**Goal**: Step-by-step operational runbook for setting up a new enterprise pilot tenant in 5 business days.

**Files to create**:
- `docs/pilot/TENANT_SETUP_RUNBOOK.md`
- `docs/build/slices/PROD11_TENANT_SETUP_RUNBOOK.md`

**Runbook steps**:
1. Pre-flight: confirm data sharing agreement (L0-L4 tier)
2. Create tenant in Postgres
3. Configure Clerk org + user roles
4. Seed initial program data (if client provides)
5. Configure Azure private data plane (if Tier 3 client)
6. Verify all 16 routes return 200 for new tenant
7. Send client login credentials securely
8. Schedule onboarding call

---

### LANE-C — PROD12: Pilot Onboarding Package

**Goal**: Client-facing onboarding materials for the enterprise pilot.

**Files to create**:
- `docs/pilot/ONBOARDING_GUIDE.md` — What Nexus does, navigation guide, glossary
- `docs/pilot/ADVISOR_QUICK_START.md` — For the advisor persona (5-minute guide)
- `docs/pilot/EXECUTIVE_QUICK_START.md` — For the client's CXO/executive sponsor (3-minute guide)
- `docs/pilot/FAQ.md` — 10 most common questions from pilot clients
- `docs/build/slices/PROD12_ONBOARDING_PACKAGE.md`

---

### LANE-D — DEMO10: Enterprise Pilot Demo Script (45 min)

**Goal**: 45-minute deep-dive demo script for the pilot client's full leadership team.

**Files to create**:
- `docs/demo/DEMO10_ENTERPRISE_PILOT_DEEP_DIVE.md`
- `docs/build/slices/DEMO10_ENTERPRISE_PILOT_DEMO.md`

**Script flow**:
1. [min 0-5] Product overview and AbarVa positioning
2. [min 5-15] Programs surface (APX-CDP-2026 in depth)
3. [min 15-25] Source commercial (AMS event, vendor pricing, BAFO)
4. [min 25-35] Intelligence + Tower (Sentinel patterns, Atlas executive brief)
5. [min 35-40] Admin surface (data trust, production readiness)
6. [min 40-45] Azure private data plane architecture (for CTO)

---

### LANE-E — DEMO11: Investor Package (15 min)

**Goal**: 15-minute investor demo focused on market opportunity and product differentiation.

**Files to create**:
- `docs/demo/DEMO11_INVESTOR_PACKAGE.md`
- `docs/build/slices/DEMO11_INVESTOR_PACKAGE.md`

**Script flow**:
1. [min 0-3] Problem: enterprise procurement is broken at the data layer
2. [min 3-8] Solution: AI-native intelligence with enterprise trust controls
3. [min 8-12] Demo: Tower portfolio view + 1 program flow
4. [min 12-15] Market, traction, roadmap

---

### LANE-F — DEMO12: Advisor 15-Minute Script

**Goal**: 15-minute demo specifically for advisory firm advisors (procurement consultants).

**Files to create**:
- `docs/demo/DEMO12_ADVISOR_15_MIN.md`
- `docs/build/slices/DEMO12_ADVISOR_SCRIPT.md`

---

## Conflicts to Watch

- LANE-A and LANE-B reference Azure private data plane — must be consistent with Wave 24 decisions
- All demo scripts (LANE-D/E/F) must reference only real product capabilities — never promise features not yet built

---

## Acceptance Criteria

- [ ] Security posture document reviewed by founder and approved for sharing with pilot clients
- [ ] Tenant setup runbook verified end-to-end (create a test tenant using the runbook)
- [ ] Onboarding guide reviewed by a non-technical person (readability check)
- [ ] 45-minute deep-dive script can be walked cold by the founder
- [ ] Investor package reviewed by founder
- [ ] No fabricated metrics, market sizes, or ROI claims in any demo script
