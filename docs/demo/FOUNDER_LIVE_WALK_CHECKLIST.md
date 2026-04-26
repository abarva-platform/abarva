# AbarVa Founder Live Walk Checklist

**Date:** 2026-04-26
**Version:** 1.0.0
**Slice:** LIVE1
**Status:** code_complete

## Purpose

This checklist documents the step-by-step live demo walk for the AbarVa platform. It covers all
major surfaces in the order a founder should navigate during a boardroom or seed-round live
demonstration. Each step includes the expected question from the audience, what to click, what to
say, what the audience should see on screen, a fallback if that surface is blocked, and an honest
readiness caveat.

All steps are sourced from the deterministic `buildFounderLiveWalkChecklist()` function in
`src/lib/qa/founder-live-walk-checklist.ts`. The checklist is evidence-backed and file-pure — no
live data, no fabricated greens.

---

## Step LIVE1-S01 — Home

| Field | Value |
|---|---|
| **Route** | `/home` |
| **Surface** | home |
| **Purpose** | Orient the founder to the executive entry point |
| **Expected Question** | What is the AI portfolio status? |
| **Primary Agent** | Atlas |
| **What to Click** | AI Activity card or queue panel |
| **What to Say** | This is the command center — all active AI programs, recent alerts, and actions in one view. |
| **Expected Visible Signal** | Queue panel visible, program count shown |
| **Fallback if Blocked** | Navigate to /platform/admin |
| **Readiness Caveat** | Home page is deterministic seed data; live DB may differ |

---

## Step LIVE1-S02 — Platform Admin

| Field | Value |
|---|---|
| **Route** | `/platform/admin` |
| **Surface** | admin |
| **Purpose** | Show platform steward view |
| **Expected Question** | How is the platform configured? |
| **Primary Agent** | Steward |
| **What to Click** | Platform Admin nav link |
| **What to Say** | Steward manages tenants, data readiness, and platform health. |
| **Expected Visible Signal** | Admin panel with tenant list or tabs |
| **Fallback if Blocked** | Show /platform/admin/build-progress |
| **Readiness Caveat** | Requires admin Clerk role |

---

## Step LIVE1-S03 — Production Readiness

| Field | Value |
|---|---|
| **Route** | `/platform/admin/production-readiness` |
| **Surface** | admin |
| **Purpose** | Show production readiness tracker |
| **Expected Question** | What is actually production-ready? |
| **Primary Agent** | Steward |
| **What to Click** | Production Readiness tab or link |
| **What to Say** | Every component has an honest readiness state — no false greens. |
| **Expected Visible Signal** | Readiness table with component rows and status chips |
| **Fallback if Blocked** | Show docs/build/production-readiness.json directly |
| **Readiness Caveat** | Static manifest; live Vercel/CI status requires external polling |

---

## Step LIVE1-S04 — Build Progress

| Field | Value |
|---|---|
| **Route** | `/platform/admin/build-progress` |
| **Surface** | admin |
| **Purpose** | Show wave/slice build progress |
| **Expected Question** | How far is the build? |
| **Primary Agent** | Steward |
| **What to Click** | Build Progress tab |
| **What to Say** | 13 waves, 157+ slices tracked — every commit is evidence-backed. |
| **Expected Visible Signal** | Wave progress table with percentComplete bars |
| **Fallback if Blocked** | Show docs/build/build-waves.json |
| **Readiness Caveat** | Wave 12 merged; wave 13 in progress |

---

## Step LIVE1-S05 — Apex Retail Program Portfolio

| Field | Value |
|---|---|
| **Route** | `/tenant/apex-retail/programs` |
| **Surface** | programs |
| **Purpose** | Show Apex Retail AI program portfolio |
| **Expected Question** | What programs is Apex running? |
| **Primary Agent** | Nexus |
| **What to Click** | Programs nav or tenant switcher |
| **What to Say** | Apex Retail has 4 active AI programs — Contact Center AI, CDP, Store Associate Productivity, Demand Forecasting. |
| **Expected Visible Signal** | Program cards grid with phase indicators |
| **Fallback if Blocked** | Navigate directly to /programs |
| **Readiness Caveat** | Apex seed data; requires Clerk demo tenant context |

---

## Step LIVE1-S06 — Program Detail

| Field | Value |
|---|---|
| **Route** | `/tenant/apex-retail/programs/[programSlug]` |
| **Surface** | programs |
| **Purpose** | Deep-dive into a single program |
| **Expected Question** | What is the health of this program? |
| **Primary Agent** | Nexus |
| **What to Click** | Contact Center AI program card |
| **What to Say** | Phase gate enforced — milestones, risks, deliverables, sponsor commitment all tracked. |
| **Expected Visible Signal** | Program detail with phase tabs, milestone list, risk flags |
| **Fallback if Blocked** | Show /programs/[programId] with seed programId |
| **Readiness Caveat** | Phase gate is deterministic; live DB required for real progress |

---

## Step LIVE1-S07 — AI Control Tower

| Field | Value |
|---|---|
| **Route** | `/tenant/apex-retail/tower` |
| **Surface** | tower |
| **Purpose** | Show AI Control Tower |
| **Expected Question** | Who owns AI governance? |
| **Primary Agent** | Atlas |
| **What to Click** | Tower tab in tenant nav |
| **What to Say** | Atlas surfaces cost, adoption, risk, and governance signals across the entire AI portfolio. |
| **Expected Visible Signal** | Tower dashboard with signal cards |
| **Fallback if Blocked** | Show /tower |
| **Readiness Caveat** | Tower seed data; real cost/adoption requires live integrations |

---

## Step LIVE1-S08 — Intelligence Library

| Field | Value |
|---|---|
| **Route** | `/tenant/apex-retail/intelligence` |
| **Surface** | intelligence |
| **Purpose** | Show intelligence library |
| **Expected Question** | What patterns and signals does AbarVa surface? |
| **Primary Agent** | Sentinel |
| **What to Click** | Intelligence tab |
| **What to Say** | Sentinel surfaces competitive, market, and program intelligence — grounded in evidence. |
| **Expected Visible Signal** | Intelligence cards or pattern list |
| **Fallback if Blocked** | Show /intelligence |
| **Readiness Caveat** | Pattern library is deterministic seed; live signals need external data |

---

## Step LIVE1-S09 — Intelligence Pattern Detail

| Field | Value |
|---|---|
| **Route** | `/tenant/apex-retail/intelligence/patterns/[patternKey]` |
| **Surface** | intelligence |
| **Purpose** | Show a specific intelligence pattern |
| **Expected Question** | What does this pattern tell us? |
| **Primary Agent** | Sentinel |
| **What to Click** | Any pattern card |
| **What to Say** | Each pattern has evidence basis, confidence score, and recommended action. |
| **Expected Visible Signal** | Pattern detail with evidence section and recommended action |
| **Fallback if Blocked** | Show /intelligence/patterns |
| **Readiness Caveat** | Pattern content is seed; confidence scores are deterministic |

---

## Step LIVE1-S10 — Source Procurement Intelligence

| Field | Value |
|---|---|
| **Route** | `/source` |
| **Surface** | source |
| **Purpose** | Show Source procurement intelligence |
| **Expected Question** | How does AbarVa support vendor selection? |
| **Primary Agent** | Source |
| **What to Click** | Source nav item |
| **What to Say** | Source tracks RFP events, vendor responses, pricing normalization, and commercial traps. |
| **Expected Visible Signal** | Source dashboard with events list or status chips |
| **Fallback if Blocked** | Show /source/events |
| **Readiness Caveat** | Source uses seed events; live vendor data requires client input |

---

## Step LIVE1-S11 — Procurement Event List

| Field | Value |
|---|---|
| **Route** | `/source/events` |
| **Surface** | source |
| **Purpose** | Show procurement event list |
| **Expected Question** | What RFP events are active? |
| **Primary Agent** | Source |
| **What to Click** | Events tab or link |
| **What to Say** | Each event has a vendor scorecard, response completeness, and pricing comparability status. |
| **Expected Visible Signal** | Event cards with status chips |
| **Fallback if Blocked** | Show seed event detail |
| **Readiness Caveat** | Events are deterministic seed data |

---

## Step LIVE1-S12 — Azure Private Data Plane Architecture

| Field | Value |
|---|---|
| **Route** | `docs/architecture` |
| **Surface** | architecture |
| **Purpose** | Explain Azure private data plane story |
| **Expected Question** | How does AbarVa handle Fortune 500 data trust? |
| **Primary Agent** | N/A (architecture doc) |
| **What to Click** | N/A — show AZLAB1 blueprint doc |
| **What to Say** | AbarVa runs a SaaS control plane. Client data stays in a private Azure data plane the client controls. No raw data leaves client boundary. |
| **Expected Visible Signal** | AZLAB1 architecture blueprint rendered or PDF shown |
| **Fallback if Blocked** | Read docs/architecture/AZLAB1_SAAS_CONTROL_PLANE_PRIVATE_DATA_PLANE_BLUEPRINT.md aloud |
| **Readiness Caveat** | Lab is planned for May 4; current connector is a stub |

---

## Demo Readiness Summary

| Step | Surface | Status | Caveat |
|---|---|---|---|
| LIVE1-S01 | home | Deterministic seed | Live DB may differ |
| LIVE1-S02 | admin | Requires Clerk admin role | Auth gate present |
| LIVE1-S03 | admin | Static manifest | No live Vercel/CI polling |
| LIVE1-S04 | admin | Deterministic JSON manifest | Wave 13 in progress |
| LIVE1-S05 | programs | Apex seed data | Clerk demo context required |
| LIVE1-S06 | programs | Phase gate deterministic | Real progress needs live DB |
| LIVE1-S07 | tower | Seed data | Live cost/adoption deferred |
| LIVE1-S08 | intelligence | Deterministic seed | Live signals need external data |
| LIVE1-S09 | intelligence | Seed pattern content | Confidence scores are deterministic |
| LIVE1-S10 | source | Seed events | Live vendor data needs client input |
| LIVE1-S11 | source | Seed events | Deterministic only |
| LIVE1-S12 | architecture | Doc only | Azure lab planned May 4; connector is a stub |

**Honest caveats:**

- All 12 steps are walkable with the demo Clerk accounts and seed data installed in the demo
  environment. No step requires live external integrations to render.
- Steps requiring tenant context (S05–S09) require the `apex-retail` demo tenant to be active in
  Clerk. Log in as the `arcturus client` or `admin` demo user.
- The architecture step (S12) has no live UI surface — it is narrated from the blueprint doc.
- Real-time data (cost, adoption, live events, AI signals) is seeded and deterministic. Claims about
  live ingestion are explicitly deferred.
- The Azure private data plane (AZLAB1) connector is a stub as of 2026-04-26; the lab is planned
  for May 4.
