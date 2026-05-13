# AbarVa Browser-Crawl Audit — 2026-05-13 — Working Scratchpad

## Auth note (resolved blocker)
- Old memory (`demo_accounts.md`) said `demo-apexretail+clerk_test@abarva.com` / `Demo2026!` / OTP `424242`. **STALE.**
- New canonical roster (per `src/lib/auth/canonical-auth-roster.ts`, founder direction 2026-05-08): role-based emails `cio@apex-retail.example.com`, `cdo@apex-retail.example.com`, `cdio@meridian-health.example.com`, `cdao@meridian-health.example.com`, `cio@firstcapital.example.com`. Password + access code unchanged.
- Personas per tenant: **Apex 2 / Meridian 2 / First Capital 1** — not 3 each as audit prompt assumed.
- Will update memory at end of session.

## Defects log

### P0 (demo-killing)
*(none yet)*

### P1 (visible to a CXO)
- **D-001**  `/sign-in`  Dark-themed sign-in surface conflicts with locked AbarVa design canon (#F8F7F4 cream bg + Georgia + black/ghost). CTA is solid blue `#0066CC`, not black. **In-app `/home` IS canon-compliant, so the sign-in page is the outlier and feels like a different product.**  Fix: rebuild sign-in surface on the canon palette.
- **F-001**  Persona coverage  Audit prompt expected ~3 CXO personas per tenant. Actual rostered count: Apex 2, Meridian 2, First Capital 1. Sentinel-as-consultant story for First Capital is materially thinner than for Apex/Meridian. Fix: provision at least CFO + COO seats per tenant, or update the demo narrative.

### P2 (polish)
- **C-001**  `/sign-in`  Brand lockup reads "AbarVa | AI Success Platform". Confirm tagline alignment with current "tenant-grounded consultant-grade decision OS" positioning.

### P3 (nit)
*(none yet)*

## Apex Retail — page-by-page log

### /home (Carlos Rivera, CIO)
- URL: `https://nexus-vert-kappa.vercel.app/home`
- Title: `Home · AbarVa`
- Tenant ID: ✅ "Apex Retail Group" + AR logo + sidebar "tenant data plane apex-retail · live"
- Persona indicator: ✅ "CR Carlos Rivera" top-right
- Hero copy: ✅ "$18B omnichannel retailer · 72,000 employees (retail-heavy) · 480 stores + 12 DCs + e-commerce · national US footprint Shopify Plus + Salesforce Commerce + SAP S/4" — specific, grounded
- Chips: INDUSTRY: RETAIL · 23 SEGMENTS LOADED · 883 RECORDS · SUBSTRATE LIVE · 6 SEGMENTS NEED ATTENTION · REFRESHED 22H AGO
- Module readiness tiles: Tower 72 · Source 78 · Intelligence 76 · Strategic Moves 71 — concrete, sub-line callouts have program names (CDP migration, Contact Center AI pilot)
- Section 02: "What's loaded, what's missing" — Steward Voice framing
- Design canon: ✅ cream bg, Georgia headlines, DM-Sans body, ghost-style left rail
- Console: clean post-login except earlier invalid_credentials error (pre-login attempts)
- Network: not yet probed
- Page sections (full): hero → 01 Readiness across modules → 02 What's loaded, what's missing (5 loaded F-codes / 5 missing F-codes + "Next load · highest leverage: Customer LTV cohorts gates CDP ROI math") → 03 Action queue (4 items: Approve Contact Center AI Phase 2 / Resolve store-associate productivity slip / Load substrate for Customer LTV cohorts / Confirm CDP migration sequencing with CFO) → 04 Recent activity (substrate audit log) → 05 Setup panels (8 panels: Data Trust / AI Initiatives / Connectors / Users & Access / Agent Readiness / Production Readiness / Compliance · LOCKED / Activity Log)
- **Strength:** dense, action-oriented, every callout cites a specific Apex initiative or substrate F-code. Feels like a real consultant briefing.
- **D-002**  P3  Sidebar item "Production Readin..." truncates at ~14 chars in the left rail. Should ellipsize gracefully or shorten label.

